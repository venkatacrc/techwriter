// Render every page of web/app.js against a stub DOM. Fail on exceptions or missing text.
//   node tools/smoke_web.js
const fs = require("fs");
const path = require("path");
const web = path.join(__dirname, "..", "web");

const els = new Map();
function el(sel) {
  if (!els.has(sel)) {
    const store = {
      innerHTML: "", textContent: "", hidden: false, value: "", checked: false, scrollTop: 0,
      dataset: {}, className: "", style: {}, files: [],
    };
    const classes = new Set();
    store.classList = {
      toggle(c) { classes.has(c) ? classes.delete(c) : classes.add(c); },
      add(c) { classes.add(c); },
      remove(c) { classes.delete(c); },
      contains(c) { return classes.has(c); },
    };
    store.addEventListener = (ev, fn) => { (store.handlers = store.handlers || {})[ev] = fn; };
    store.querySelector = (s) => el(sel + " " + s);
    store.querySelectorAll = () => [];
    store.closest = () => null;
    store.focus = () => {};
    store.blur = () => {};
    store.click = () => {};
    store.showModal = () => {};
    store.matches = () => false;
    store.setAttribute = () => {};
    store.removeAttribute = () => {};
    els.set(sel, store);
  }
  return els.get(sel);
}

const handlers = {};
global.document = {
  title: "",
  querySelector: el,
  querySelectorAll: () => [],
  addEventListener: (ev, fn) => { (handlers[ev] = handlers[ev] || []).push(fn); },
  createElement: () => el("el-" + Math.random()),
};
global.window = {
  addEventListener: (ev, fn) => { handlers["w:" + ev] = fn; },
  print: () => {},
  isSecureContext: false,
};
global.confirm = () => true;
const mem = {};
global.localStorage = { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = v; } };
global.location = {
  _hash: "",
  protocol: "file:",
  search: "",
  get hash() { return this._hash; },
  set hash(v) {
    const next = v ? (v.startsWith("#") ? v : "#" + v) : "";
    if (next === this._hash) return;
    this._hash = next;
    if (handlers["w:hashchange"]) handlers["w:hashchange"]();
  },
};
global.navigator = {};
global.URL = URL;
const content = JSON.parse(fs.readFileSync(path.join(web, "content.json"), "utf8"));
global.fetch = async () => ({ json: async () => content });

const errors = [];
process.on("unhandledRejection", (e) => errors.push(e));
eval(fs.readFileSync(path.join(web, "app.js"), "utf8"));

function ordinal(y, m, d) {
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000) + 719163;
}

setTimeout(() => {
  const stage = el("#stage");
  const actions = el("#actions");
  const drawerBody = el("#drawer-body");
  const check = (ok, msg) => { if (!ok) errors.push(new Error(msg)); };
  check(stage.innerHTML.includes("Build the writing muscle"), "welcome screen did not render");
  check(actions.innerHTML.includes("Start week 1"), "welcome actions missing Start week 1");

  const go = (hash, expect) => {
    try { location.hash = hash; }
    catch (e) { errors.push(new Error(`${hash}: ${e.stack}`)); return; }
    if (expect) check(stage.innerHTML.includes(expect), `${hash}: missing “${expect}”`);
  };
  const fire = (type, target, extra = {}) => {
    try { for (const fn of handlers[type] || []) fn({ target, preventDefault() {}, ...extra }); }
    catch (e) { errors.push(e); }
  };
  const button = (dataset) => {
    const t = { dataset, disabled: false, matches: () => false };
    t.closest = () => t;
    return t;
  };
  const click = (dataset) => fire("click", button(dataset));

  for (const it of content.items) go(it.id, it.title.slice(0, 24).replace(/&/g, "&amp;"));
  go("today", "Build the writing muscle");
  go("missing", "Build the writing muscle");

  // The drawer opens over the page and lists the current view's pages.
  el("#open-drawer").handlers.click();
  check(el("#drawer").classList.contains("open"), "drawer did not open");
  check(drawerBody.innerHTML.includes("week-1") && drawerBody.innerHTML.includes("Export notes"), "drawer missing weeks or More panel");
  el("#backdrop").handlers.click();
  check(!el("#drawer").classList.contains("open"), "backdrop did not close the drawer");

  const now = new Date();
  const drill = ["D01", "D02", "D03", "D04"][ordinal(now.getFullYear(), now.getMonth() + 1, now.getDate()) % 4];
  el("#start-date").value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  click({ act: "begin" });
  check(stage.innerHTML.includes("Week 1 of 12") && stage.innerHTML.includes(drill), "today did not show week 1 and drill " + drill);
  check(actions.innerHTML.includes(`data-id="${drill}"`), "Today's drill button does not point at " + drill);

  go("D01", "Done when");
  check(actions.innerHTML.includes("timer-btn") && actions.innerHTML.includes("Done"), "drill actions missing timer or done");
  fire("input", { id: "pad", value: "Ten claims about the kernel.", dataset: {} });
  click({ act: "done" });
  check(actions.innerHTML.includes("btn good"), "mark done did not stick");
  click({ act: "timer" });
  check(el("#actions").innerHTML.includes("⏱"), "timer label missing");
  click({ act: "timer" });

  fire("keydown", { matches: () => false }, { key: "ArrowRight" });
  check(location.hash === "#D02", "ArrowRight did not move to D02: " + location.hash);
  click({ act: "step", delta: "-1" });
  check(location.hash === "#D01", "previous button did not return to D01");
  if (el("#pad").value !== "Ten claims about the kernel.") errors.push(new Error("note was not saved: " + JSON.stringify(el("#pad").value)));

  // Drills drawer: one collapsible group per week, current one open.
  el("#open-drawer").handlers.click();
  check(drawerBody.innerHTML.includes("source-head") && drawerBody.innerHTML.includes('data-id="D01"'), "drills drawer missing groups");
  check(drawerBody.innerHTML.includes('class="row on"'), "drills drawer does not mark the open page");
  click({ act: "fold", section: content.items.find((i) => i.id === "D01").section });
  check(!drawerBody.innerHTML.includes('data-id="D01"'), "folding the week did not hide its drills");

  fire("input", { id: "search", value: "atomics", dataset: {} });
  check(/atomics|Explaining/i.test(drawerBody.innerHTML), "search missed the atomics pages");
  fire("input", { id: "search", value: "", dataset: {} });

  click({ act: "view", view: "library" });
  check(content.items.find((i) => i.id === location.hash.slice(1)).view === "library", "Library switch did not open a library page");
  click({ act: "view", view: "today" });
  check(stage.innerHTML.includes("Week 1 of 12"), "Today switch did not return to today");

  go("principles/05_math", "∑");
  go("week-1", "Weekly piece");
  check(actions.innerHTML.includes("Piece done"), "week actions missing Piece done");

  // 2026-10-28 is ordinal 739917 in Python's datetime.date
  check(ordinal(2026, 10, 28) === 739917, "ordinal " + ordinal(2026, 10, 28) + " != 739917");
  if (errors.length) {
    for (const e of errors) console.error(e.stack || e);
    process.exit(1);
  }
  console.log(`smoke ok: ${content.items.length} pages`);
  process.exit(0);
}, 30);
