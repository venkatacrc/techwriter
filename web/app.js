/* Techwriter: read the program, do the drills, keep notes on this device. */
(() => {
  "use strict";

  const STORE = "tw-web-v1";
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  let content = null;
  let items = [];
  let byId = {};
  let state = load();
  let currentId = null;
  let currentView = "today";
  let tickTimer = null;

  function load() {
    const empty = { start: "", done: {}, notes: {}, checks: {}, activity: {} };
    try { return Object.assign(empty, JSON.parse(localStorage.getItem(STORE) || "{}")); }
    catch { return empty; }
  }
  function save() { localStorage.setItem(STORE, JSON.stringify(state)); }
  function toast(msg) {
    const t = $("#toast");
    if (!t) return;
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => (t.hidden = true), 2200);
  }
  function iso(d) {
    const z = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
  }
  function markActivity() { state.activity[iso(new Date())] = 1; }

  /* Python datetime.date.toordinal, so today's drill matches `tw today`.
     719163 is date(1970, 1, 1).toordinal(). Date.UTC(year 1) is not year 1. */
  function toordinal(d) {
    const unixDays = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
    return unixDays + 719163;
  }
  function weekNumber() {
    if (!state.start) return null;
    const start = new Date(state.start + "T00:00:00");
    const now = new Date();
    const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const days = Math.round((today0 - start) / 86400000);
    return { week: Math.floor(Math.max(days, 0) / 7) + 1, day: (Math.max(days, 0) % 7) + 1, days };
  }
  function streak() {
    let n = 0;
    const d = new Date();
    if (!state.activity[iso(d)]) d.setDate(d.getDate() - 1);
    while (state.activity[iso(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function words(s) { return (s.trim().match(/\S+/g) || []).length; }

  function ring(frac) {
    const r = 8, c = 2 * Math.PI * r;
    return `<svg class="ring" viewBox="0 0 22 22" aria-hidden="true">
      <circle cx="11" cy="11" r="${r}" fill="none" stroke="var(--line)" stroke-width="3"/>
      <circle cx="11" cy="11" r="${r}" fill="none" stroke="var(--accent)" stroke-width="3"
        stroke-dasharray="${(c * frac).toFixed(2)} ${c.toFixed(2)}" transform="rotate(-90 11 11)" stroke-linecap="round"/></svg>`;
  }
  function fracOf(it) {
    if (it.view === "drills") return state.done[it.id] ? 1 : 0;
    if (it.drills && it.drills.length) return it.drills.filter((id) => state.done[id]).length / it.drills.length;
    return null;
  }

  function closeNav() {
    const side = $("#sidebar");
    if (side) side.classList.remove("open");
    const scrim = $("#scrim");
    if (scrim) scrim.hidden = true;
  }
  function setTabs(view) {
    $$(".tabs button").forEach((b) => {
      const on = b.dataset.view === view;
      b.classList.toggle("on", on);
      if (on) b.setAttribute("aria-selected", "true");
      else b.removeAttribute("aria-selected");
    });
  }
  function crumb(text) {
    const c = $("#crumb");
    if (c) c.textContent = text;
    document.title = text === "Today" ? "Techwriter" : `${text} · Techwriter`;
  }

  function renderSidebar() {
    const list = $("#list");
    if (!list) return;
    const q = ($("#search") && $("#search").value || "").trim().toLowerCase();
    const view = currentView === "today" ? "weeks" : currentView;
    let rows = q
      ? items.filter((it) => (it._text || "").includes(q))
      : items.filter((it) => it.view === view);
    let html = "";
    let section = null;
    if (!rows.length) html = `<li class="section">No matches</li>`;
    for (const it of rows) {
      if (!q && it.section && it.section !== section) {
        section = it.section;
        html += `<li class="section">${esc(section)}</li>`;
      }
      const frac = fracOf(it);
      const sub = q ? it.kicker || it.section : (it.view === "drills" ? `${it.minutes} min · ${it.skill}` : it.kicker);
      html += `<li class="row${it.id === currentId ? " on" : ""}" data-id="${esc(it.id)}">
        ${it.short ? `<span class="num">${esc(it.short)}</span>` : ""}
        <span class="t">${esc(it.title)}${sub ? `<small>${esc(sub)}</small>` : ""}</span>
        ${frac === null ? "" : ring(frac)}
      </li>`;
    }
    list.innerHTML = html;
    const foot = $("#sideFoot");
    if (foot) {
      const built = content ? content.built : "";
      foot.textContent = q ? `${rows.length} matches` : `${items.length} pages · built ${built}`;
    }
    const current = [...list.querySelectorAll("li.row")].find((el) => el.dataset.id === currentId);
    if (current && current.scrollIntoView) current.scrollIntoView({ block: "nearest" });
  }

  function go(id) {
    if (location.hash.slice(1) === id) route();
    else location.hash = id;
  }

  function neighbors() {
    return items.filter((it) => it.view === currentView);
  }
  function step(dir) {
    if (currentView === "today") return;
    const list = neighbors();
    const i = list.findIndex((it) => it.id === currentId);
    const n = list[i + dir];
    if (n) go(n.id);
  }

  function renderToday() {
    currentId = null;
    currentView = "today";
    setTabs("today");
    crumb("Today");
    const main = $("#main");
    if (!state.start) {
      const today = iso(new Date());
      main.innerHTML = `<article class="today">
        <p class="kicker">12 weeks</p>
        <h1>Build the writing muscle</h1>
        <p class="lead">${esc(content.blurb || "")}</p>
        <ol class="rules">
          <li>Write before you read the guide.</li>
          <li>Never edit while drafting. Timer on, then stop.</li>
          <li>Cool off for 24 hours before reviewing.</li>
          <li>Ship on schedule.</li>
          <li>No model answers. Reviewers point at problems; you fix them.</li>
        </ol>
        <div class="date">
          <label>Week 1 begins <input type="date" id="startDate" value="${today}"></label>
          <button type="button" class="btn primary" id="begin">Start</button>
        </div>
        <p class="fine">Set the same day you run <code>tw start</code> on your computer, and the two will pick the same drill.</p>
        <p><a class="inapp" href="#program">Read how the 12 weeks work</a></p>
        <p class="fine install-hint">On a phone, open the browser menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>. It keeps working offline.</p>
      </article>`;
      return;
    }
    const info = weekNumber();
    const capped = Math.min(info.week, 12);
    const week = byId["week-" + capped];
    const after = info.week > 12;
    let ids = (!after && week && week.drills.length) ? week.drills : items.filter((it) => it.view === "drills").map((it) => it.id);
    const drill = byId[ids[toordinal(new Date()) % ids.length]];
    const doneN = week && week.drills.length ? week.drills.filter((id) => state.done[id]).length : 0;
    const drillDone = Object.keys(state.done).filter((id) => byId[id] && byId[id].view === "drills").length;
    main.innerHTML = `<article class="today">
      <p class="kicker">${after ? "After the program" : `Week ${info.week} of 12 · day ${info.day}`}</p>
      <h1>${esc(after ? "Keep the cadence" : week.title)}</h1>
      <p class="lead">${esc(after ? (byId.after.summary || "") : (week.summary || ""))}</p>
      <div class="stack">
        ${!after && week.piece ? `<a class="panel-link" href="#${week.id}">
          <h2>This week's piece</h2>
          <p>${esc(week.piece)}</p>
        </a>` : `<a class="panel-link" href="#after"><h2>After week 12</h2><p>One drill a day, one finished piece a month, one submission a quarter.</p></a>`}
        ${drill ? `<a class="panel-link" href="#${drill.id}">
          <h2>Today's drill · ${drill.minutes} min</h2>
          <p><strong>${esc(drill.short)}</strong> ${esc(drill.title)}</p>
        </a>` : ""}
      </div>
      <div class="kpis">
        <div class="kpi"><b>${doneN}/${week ? week.drills.length : 0}</b><span>drills this week</span></div>
        <div class="kpi"><b>${drillDone}</b><span>drills done</span></div>
        <div class="kpi"><b>${streak()}</b><span>day streak</span></div>
      </div>
      <div class="date">
        <label class="fine">Week 1 began <input type="date" id="startDate" value="${esc(state.start)}"></label>
      </div>
      <p class="fine">Notes stay on this device. Export them from the ⋮ menu. <code>tw</code> on your computer keeps the journal.</p>
      <p class="fine install-hint">Install this page from the browser menu to use it offline, like an app.</p>
    </article>`;
  }

  function renderItem(it) {
    currentId = it.id;
    currentView = it.view;
    setTabs(it.view);
    crumb(it.short ? `${it.short} ${it.title}` : it.title);
    const list = neighbors();
    const idx = list.findIndex((x) => x.id === it.id);
    const prev = list[idx - 1];
    const next = list[idx + 1];
    const meta = [];
    if (it.minutes) meta.push(`${it.minutes} min`);
    if (it.skill) meta.push(it.skill);
    if (it.weeks && it.weeks.length) meta.push("weeks " + it.weeks.join(", "));
    const checks = (it.done || []).map((c, i) =>
      `<label class="checkrow"><input type="checkbox" data-i="${i}" ${state.checks[it.id] && state.checks[it.id][i] ? "checked" : ""}> <span>${esc(c)}</span></label>`).join("");
    const done = !!state.done[it.id];
    const padLabel = it.pad === "draft" ? "Draft the piece" : "Your attempt";
    const doneLabel = it.pad === "draft" ? "Mark piece done" : "Mark drill done";
    const pad = it.pad ? `<section class="pad">
      <h2>${padLabel}</h2>
      <div class="pad-bar">
        <span class="words" id="wordCount"></span>
        ${it.minutes ? `<button type="button" class="btn" id="timerBtn"></button>` : ""}
        <button type="button" class="btn${done ? " on" : ""}" id="doneBtn">${done ? "Done · undo" : doneLabel}</button>
      </div>
      <textarea id="pad" placeholder="${it.pad === "draft" ? "Draft here. Editing comes later, after a cool-off." : "Timer on. Write without editing until it ends."}"></textarea>
    </section>` : "";
    $("#main").innerHTML = `<article class="doc">
      <header class="doc-head">
        ${it.kicker ? `<p class="kicker">${esc(it.kicker)}</p>` : ""}
        <h1>${esc(it.title)}</h1>
        ${meta.length ? `<p class="meta">${esc(meta.join(" · "))}</p>` : ""}
      </header>
      <div class="prose">${it.html}</div>
      ${checks ? `<h2>Done when</h2><div class="checks">${checks}</div>` : ""}
      ${pad}
      <nav class="pager">
        ${prev ? `<button type="button" class="btn" data-go="${esc(prev.id)}">← ${esc(prev.short || prev.title)}</button>` : "<span></span>"}
        ${next ? `<button type="button" class="btn" data-go="${esc(next.id)}">${esc(next.short || next.title)} →</button>` : "<span></span>"}
      </nav>
    </article>`;
    const ta = $("#pad");
    if (ta) {
      ta.value = state.notes[it.id] || "";
      const wc = $("#wordCount");
      if (wc) wc.textContent = `${words(ta.value)} words`;
    }
    updateTimerButton();
    $$("#main pre").forEach((pre) => {
      if (pre.querySelector(".copy")) return;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "copy";
      b.dataset.copy = "1";
      b.textContent = "Copy";
      pre.appendChild(b);
    });
    $("#main").scrollTop = 0;
  }

  function route() {
    if (!content) return;
    const id = decodeURIComponent(location.hash.replace(/^#/, ""));
    closeNav();
    if (!id || id === "today") renderToday();
    else if (byId[id]) renderItem(byId[id]);
    else renderToday();
    renderSidebar();
  }

  function leftMs() {
    return state.timerEnd ? state.timerEnd - Date.now() : 0;
  }
  function fmt(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }
  function updateTimerButton() {
    const b = $("#timerBtn");
    if (!b) return;
    const it = byId[currentId];
    if (state.timerEnd && state.timerFor === currentId) b.textContent = fmt(leftMs()) + " · stop";
    else if (it && it.minutes) b.textContent = `Start ${it.minutes}:00`;
  }
  function beep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 660;
      o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.04, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      o.start();
      o.stop(ctx.currentTime + 0.4);
    } catch { /* autoplay blocked */ }
  }
  function timerTick() {
    clearTimeout(tickTimer);
    if (!state.timerEnd) { updateTimerButton(); return; }
    if (leftMs() <= 0) {
      const forId = state.timerFor;
      state.timerEnd = null;
      save();
      updateTimerButton();
      beep();
      if (navigator.vibrate) navigator.vibrate([180, 80, 180]);
      toast(`Time is up${forId ? " on " + forId : ""}. Check it against Done when.`);
      if (currentId && byId[currentId]) crumb(byId[currentId].short ? `${byId[currentId].short} ${byId[currentId].title}` : byId[currentId].title);
      else crumb("Today");
      return;
    }
    updateTimerButton();
    if (state.timerFor && byId[state.timerFor]) crumb(fmt(leftMs()) + " · " + (byId[state.timerFor].short || ""));
    tickTimer = setTimeout(timerTick, 250);
  }
  function toggleTimer() {
    const it = byId[currentId];
    if (!it || !it.minutes) return;
    if (state.timerEnd && state.timerFor === currentId) {
      state.timerEnd = null;
      save();
      updateTimerButton();
      crumb(it.short ? `${it.short} ${it.title}` : it.title);
      return;
    }
    state.timerEnd = Date.now() + it.minutes * 60000;
    state.timerFor = currentId;
    save();
    timerTick();
  }

  function copyCode(btn) {
    const code = btn.closest("pre").querySelector("code");
    const text = code ? code.textContent : "";
    const done = () => toast("Copied");
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, done);
    else done();
  }

  function exportNotes() {
    const blob = new Blob([JSON.stringify({
      start: state.start, done: state.done, notes: state.notes,
      checks: state.checks, activity: state.activity,
    }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `techwriter-notes-${iso(new Date())}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  }
  function importNotes(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        for (const key of ["done", "notes", "checks", "activity"]) {
          if (data[key] && typeof data[key] === "object") state[key] = Object.assign(state[key], data[key]);
        }
        if (data.start && !state.start) state.start = data.start;
        save();
        toast("Notes imported");
        route();
      } catch { toast("That file is not notes from this app"); }
    };
    reader.readAsText(file);
  }

  document.addEventListener("click", (e) => {
    const menu = $("#moreMenu");
    if (e.target.closest("#moreBtn")) {
      if (menu) menu.hidden = !menu.hidden;
      return;
    }
    if (menu && !e.target.closest(".menu")) menu.hidden = true;
    if (e.target.closest("#menuBtn")) {
      $("#sidebar").classList.toggle("open");
      $("#scrim").hidden = !$("#sidebar").classList.contains("open");
      return;
    }
    if (e.target.id === "scrim") { closeNav(); return; }
    const row = e.target.closest("#list li.row");
    if (row) { go(row.dataset.id); return; }
    const tab = e.target.closest(".tabs button");
    if (tab) {
      const view = tab.dataset.view;
      if (view === currentView) { closeNav(); return; }
      if (view === "today") { go("today"); return; }
      const first = items.find((it) => it.view === view);
      if (first) go(first.id);
      return;
    }
    const jump = e.target.closest("[data-go]");
    if (jump) { go(jump.dataset.go); return; }
    if (e.target.id === "begin") {
      state.start = ($("#startDate") && $("#startDate").value) || iso(new Date());
      markActivity();
      save();
      go("today");
      return;
    }
    if (e.target.id === "timerBtn") { toggleTimer(); return; }
    if (e.target.id === "doneBtn") {
      if (state.done[currentId]) delete state.done[currentId];
      else { state.done[currentId] = iso(new Date()); markActivity(); }
      save();
      route();
      return;
    }
    if (e.target.dataset && e.target.dataset.copy) { copyCode(e.target); return; }
    if (e.target.id === "exportBtn") { exportNotes(); if (menu) menu.hidden = true; return; }
    if (e.target.id === "importBtn") { $("#importFile").click(); if (menu) menu.hidden = true; return; }
    if (e.target.id === "printBtn") { window.print(); if (menu) menu.hidden = true; return; }
    if (e.target.id === "resetBtn") {
      if (menu) menu.hidden = true;
      if (confirm("Delete the notes and progress stored on this device?")) {
        state = { start: "", done: {}, notes: {}, checks: {}, activity: {} };
        save();
        toast("Cleared");
        go("today");
      }
      return;
    }
    if (e.target.id === "helpBtn") {
      if (menu) menu.hidden = true;
      const dlg = $("#helpDlg");
      if (dlg && dlg.showModal) dlg.showModal();
    }
  });

  document.addEventListener("input", (e) => {
    if (e.target.id === "search") { renderSidebar(); return; }
    if (e.target.id === "pad") {
      state.notes[currentId] = e.target.value;
      markActivity();
      clearTimeout(input._t);
      input._t = setTimeout(save, 250);
      const wc = $("#wordCount");
      if (wc) wc.textContent = `${words(e.target.value)} words`;
    }
  });
  function input() {}
  document.addEventListener("change", (e) => {
    if (e.target.id === "startDate" && state.start && e.target.value) {
      state.start = e.target.value;
      save();
      route();
      return;
    }
    if (e.target.matches && e.target.matches(".checks input")) {
      const arr = state.checks[currentId] || [];
      arr[+e.target.dataset.i] = e.target.checked;
      state.checks[currentId] = arr;
      markActivity();
      save();
      return;
    }
    if (e.target.id === "importFile" && e.target.files[0]) {
      importNotes(e.target.files[0]);
      e.target.value = "";
    }
  });

  document.addEventListener("keydown", (e) => {
    const typing = e.target.matches && e.target.matches("textarea, input");
    if (e.key === "Escape") {
      closeNav();
      if (typing) e.target.blur();
      return;
    }
    if (typing) return;
    if (e.key === "ArrowRight") step(1);
    else if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "/") { e.preventDefault(); const s = $("#search"); if (s) s.focus(); }
    else if ("1234".includes(e.key)) {
      const view = ["today", "weeks", "drills", "library"][e.key - 1];
      if (view === "today") go("today");
      else {
        const first = items.find((it) => it.view === view);
        if (first) go(first.id);
      }
    }
  });

  let touchX = 0, touchY = 0;
  const mainEl = $("#main");
  if (mainEl) {
    mainEl.addEventListener("touchstart", (e) => {
      touchX = e.changedTouches[0].clientX;
      touchY = e.changedTouches[0].clientY;
    }, { passive: true });
    mainEl.addEventListener("touchend", (e) => {
      if (currentView === "today") return;
      if (e.target.closest && e.target.closest("textarea, pre, .table-wrap")) return;
      const dx = e.changedTouches[0].clientX - touchX;
      const dy = e.changedTouches[0].clientY - touchY;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  window.addEventListener("hashchange", route);

  async function init() {
    const params = new URLSearchParams(location.search);
    if (params.get("start") && /^\d{4}-\d{2}-\d{2}$/.test(params.get("start")) && !state.start) {
      state.start = params.get("start");
      save();
    }
    try {
      content = await (await fetch("content.json")).json();
    } catch {
      $("#main").innerHTML = `<p class="empty">Could not load the program. Open this folder through a web server, not as a file.</p>`;
      return;
    }
    items = content.items;
    byId = Object.fromEntries(items.map((it) => [it.id, it]));
    for (const it of items) it._text = `${it.title} ${it.kicker} ${it.section} ${it.skill} ${it.summary} ${it.html.replace(/<[^>]+>/g, " ")}`.toLowerCase();
    const repo = $("#repoLink");
    if (repo && content.repo) repo.href = content.repo;
    route();
    if (state.timerEnd) timerTick();
    if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    }
  }
  init();
})();
