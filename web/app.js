// Techwriter: read the program, do the drills, keep notes on this device.
// Plain JavaScript, no build step. content.json comes from tools/build_web.py.
(() => {
    'use strict';

    const STORE = 'tw-web-v1';
    const VIEWS = [['today', 'Today'], ['weeks', 'Weeks'], ['drills', 'Drills'], ['library', 'Library']];
    const $ = (sel) => document.querySelector(sel);
    const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    let content = null;
    let items = [];
    let byId = {};
    let state = load();
    let current = null; // the open item, or null for Today
    let view = 'today';
    let query = '';
    let tick = null;

    function load() {
        const empty = { start: '', done: {}, notes: {}, checks: {}, activity: {}, open: null, timerEnd: null, timerFor: null };
        try { return Object.assign(empty, JSON.parse(localStorage.getItem(STORE) || '{}')); }
        catch { return empty; }
    }
    function save() { localStorage.setItem(STORE, JSON.stringify(state)); }

    function toast(msg) {
        const t = $('#toast');
        t.textContent = msg;
        t.hidden = false;
        clearTimeout(toast.timer);
        toast.timer = setTimeout(() => { t.hidden = true; }, 2400);
    }

    // ---- dates, matching tools/tw.py ----

    function iso(d) {
        const z = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
    }
    // Python's date.toordinal(); 719163 is date(1970, 1, 1).toordinal().
    function toordinal(d) {
        return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000) + 719163;
    }
    function programDay() {
        if (!state.start) return null;
        const [y, m, d] = state.start.split('-').map(Number);
        const now = new Date();
        const days = Math.max(0, Math.round((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(y, m - 1, d)) / 86400000));
        return { week: Math.floor(days / 7) + 1, day: (days % 7) + 1 };
    }
    function markActivity() { state.activity[iso(new Date())] = 1; }
    function streak() {
        let n = 0;
        const d = new Date();
        if (!state.activity[iso(d)]) d.setDate(d.getDate() - 1);
        while (state.activity[iso(d)]) { n += 1; d.setDate(d.getDate() - 1); }
        return n;
    }
    const words = (s) => ((s || '').trim().match(/\S+/g) || []).length;

    // ---- program helpers ----

    const drills = () => items.filter((it) => it.view === 'drills');
    function thisWeek() {
        const p = programDay();
        if (!p) return null;
        return p.week > 12 ? null : byId['week-' + p.week];
    }
    function todaysDrill() {
        const week = thisWeek();
        const ids = week && week.drills.length ? week.drills : drills().map((d) => d.id);
        return byId[ids[toordinal(new Date()) % ids.length]];
    }
    function openWeeks() {
        if (Array.isArray(state.open)) return state.open;
        const groups = sections(drills());
        const tw = thisWeek();
        const mine = tw && groups.find((s) => s.name.startsWith(`Week ${tw.short} ·`));
        const week = current && current.view === 'drills' ? current.section : (mine ? mine.name : '');
        return [week || groups[0].name];
    }
    function weekDone(week) { return week.drills.filter((id) => state.done[id]).length; }
    function inView(v) { return items.filter((it) => it.view === v); }
    function siblings() { return current ? inView(current.view) : []; }
    function label(it) { return it.short && it.view === 'drills' ? `${it.short} · ${it.title}` : it.title; }

    // ---- navigation ----

    function go(id) {
        const hash = '#' + id;
        if (location.hash === hash) route();
        else location.hash = hash;
    }
    function step(delta) {
        const list = siblings();
        const i = list.indexOf(current);
        const next = list[i + delta];
        if (next) go(next.id);
    }
    function showView(v) {
        if (v === 'today') { go('today'); return; }
        const last = state['last_' + v];
        const target = (last && byId[last] && byId[last].view === v) ? last : inView(v)[0] && inView(v)[0].id;
        if (target) go(target);
    }

    function route() {
        if (!content) return;
        const id = decodeURIComponent(location.hash.replace(/^#/, ''));
        const it = byId[id];
        const changed = (it || null) !== current;
        current = it || null;
        view = it ? it.view : 'today';
        if (it) state['last_' + view] = it.id;
        save();
        closeDrawer();
        render();
        if (changed) { const card = $('#card'); if (card) card.scrollTop = 0; }
    }

    // ---- rendering ----

    function render() {
        renderSwitch();
        renderStatus();
        renderStage();
        renderActions();
        if ($('#drawer').classList.contains('open')) renderDrawer();
        document.title = current ? `${label(current)} · Techwriter` : 'Techwriter';
    }

    function renderSwitch() {
        $('#view-switch').innerHTML = VIEWS.map(([v, t]) =>
            `<button type="button" data-act="view" data-view="${v}" class="${v === view ? 'on' : ''}">${t}</button>`).join('');
    }

    function renderStatus() {
        let left = '';
        let right = '';
        if (!current) {
            const p = programDay();
            left = `<strong>Today</strong> · ${esc(new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }))}`;
            right = p ? `${streak()}-day streak` : 'Not started';
        } else if (current.view === 'drills') {
            left = `<strong>${esc(current.short)}</strong> · ${current.minutes} min · ${esc(current.skill)}`;
            right = state.done[current.id] ? '✓ Done' : `${drills().filter((d) => state.done[d.id]).length} of 48 done`;
        } else if (current.drills && current.drills.length) {
            left = `<strong>${esc(current.kicker)}</strong> · drills ${current.drills.join(', ')}`;
            right = `${weekDone(current)} of ${current.drills.length} done`;
        } else {
            const list = siblings();
            left = `<strong>${esc(current.section || current.kicker)}</strong>`;
            right = `${list.indexOf(current) + 1} of ${list.length}`;
        }
        $('#status').innerHTML = `<span>${left}</span><span>${right}</span>`;
    }

    function renderStage() {
        $('#stage').innerHTML = `<article class="card" id="card">${current ? pageHTML(current) : todayHTML()}</article>`;
        const pad = $('#pad');
        if (current && current.pad && pad) {
            pad.value = state.notes[current.id] || '';
            $('#word-count').textContent = `${words(pad.value)} words`;
        }
    }

    function todayHTML() {
        if (!state.start) {
            return `<p class="kicker">12 weeks · 25 minutes a day</p>
                <h1>Build the writing muscle</h1>
                <p class="lead">${esc(content.blurb)}</p>
                <h4>The rules</h4>
                <ol class="rules">
                    <li>Write before you read the guide.</li>
                    <li>Never edit while drafting. Timer on, write, stop.</li>
                    <li>Cool off for 24 hours before reviewing.</li>
                    <li>Ship on schedule.</li>
                    <li>No model answers. Reviewers point at problems; you fix them.</li>
                </ol>
                <label class="field">Week 1 begins <input type="date" id="start-date" value="${iso(new Date())}"></label>
                <p class="fine">Pick the day you ran <code>tw start</code> on your computer, so both choose the same drill.</p>
                <p class="fine install-hint">On a Pixel: Chrome ⋮ menu → <strong>Install app</strong> (or <strong>Add to Home screen</strong>). It keeps working offline.</p>`;
        }
        const p = programDay();
        const week = thisWeek();
        const drill = todaysDrill();
        const after = !week;
        const done = drills().filter((d) => state.done[d.id]).length;
        return `<p class="kicker">${after ? 'After the 12 weeks' : `Week ${p.week} of 12 · day ${p.day}`}</p>
            <h1>${esc(after ? 'Keep the cadence' : week.title)}</h1>
            <p class="lead">${esc(after ? byId.after.summary : week.summary)}</p>
            <h4>Today</h4>
            <div class="panel">
                ${drill ? `<button type="button" class="row" data-act="go" data-id="${drill.id}">
                    <span class="num">${esc(drill.short)}</span>
                    <span class="grow">${esc(drill.title)}<small>Today's drill · ${drill.minutes} min · ${esc(drill.skill)}</small></span>
                    ${state.done[drill.id] ? '<span class="tick">✓</span>' : '<span class="chev">›</span>'}
                </button>` : ''}
                ${after ? `<button type="button" class="row" data-act="go" data-id="after">
                    <span class="grow">After week 12<small>One drill a day, one finished piece a month, one submission a quarter</small></span>
                    <span class="chev">›</span></button>`
                : `<button type="button" class="row" data-act="go" data-id="${week.id}">
                    <span class="num">W${p.week}</span>
                    <span class="grow">This week's piece<small>${esc(week.piece)}</small></span>
                    ${state.done[week.id] ? '<span class="tick">✓</span>' : '<span class="chev">›</span>'}
                </button>`}
            </div>
            <div class="kpis">
                <div class="kpi"><b>${week ? `${weekDone(week)}/${week.drills.length}` : '–'}</b><span>this week</span></div>
                <div class="kpi"><b>${done}</b><span>drills done</span></div>
                <div class="kpi"><b>${streak()}</b><span>day streak</span></div>
            </div>
            <label class="field">Week 1 began <input type="date" id="start-date" value="${esc(state.start)}"></label>
            <p class="fine">Notes stay on this device. Export them from the ☰ menu. On your computer, <code>tw</code> keeps the journal.</p>`;
    }

    function pageHTML(it) {
        const meta = [];
        if (it.view === 'drills') meta.push(`${it.minutes} min`, it.skill, `weeks ${(it.weeks || []).join(', ')}`);
        const body = it.html.replace(/<pre>/g, '<pre><button type="button" class="copy" data-act="copy">Copy</button>');
        let extra = '';
        if (it.done && it.done.length) {
            const checks = state.checks[it.id] || [];
            extra += `<h4>Done when</h4><div class="panel">${it.done.map((c, i) => `
                <label class="row"><input type="checkbox" data-check="${i}" ${checks[i] ? 'checked' : ''}><span class="grow">${esc(c)}</span></label>`).join('')}</div>`;
        }
        if (it.pad) {
            extra += `<h4>${it.pad === 'draft' ? 'Draft the piece' : 'Your attempt'}</h4>
                <div class="pad">
                    <textarea id="pad" placeholder="${it.pad === 'draft' ? 'Draft here. Edit in a later session, after a cool-off.' : 'Start the timer, then write without editing until it ends.'}"></textarea>
                    <p class="words" id="word-count"></p>
                </div>`;
        }
        return `${it.kicker ? `<p class="kicker">${esc(it.kicker)}</p>` : ''}
            <h1>${esc(it.title)}</h1>
            ${meta.length ? `<p class="meta">${esc(meta.join(' · '))}</p>` : ''}
            <div class="prose">${body}</div>
            ${extra}`;
    }

    function renderActions() {
        const a = $('#actions');
        if (!current) {
            if (!state.start) {
                a.innerHTML = `<button type="button" class="btn" data-act="go" data-id="program">How it works</button>
                    <button type="button" class="btn primary" data-act="begin">Start week 1</button>`;
            } else {
                const week = thisWeek();
                const drill = todaysDrill();
                a.innerHTML = `<button type="button" class="btn" data-act="go" data-id="${week ? week.id : 'after'}">${week ? 'This week' : 'After week 12'}</button>
                    ${drill ? `<button type="button" class="btn primary" data-act="go" data-id="${drill.id}">Today's drill ›</button>` : ''}`;
            }
            return;
        }
        const list = siblings();
        const i = list.indexOf(current);
        const prev = `<button type="button" class="btn nav" data-act="step" data-delta="-1" aria-label="Previous" ${i <= 0 ? 'disabled' : ''}>‹</button>`;
        const next = `<button type="button" class="btn nav" data-act="step" data-delta="1" aria-label="Next" ${i >= list.length - 1 ? 'disabled' : ''}>›</button>`;
        let middle = '';
        if (current.view === 'drills') {
            middle = `<button type="button" class="btn" id="timer-btn" data-act="timer">${timerLabel()}</button>
                ${doneButton('Done')}`;
        } else if (current.pad) {
            middle = doneButton('Piece done');
        } else {
            middle = `<button type="button" class="btn" data-act="drawer">☰ Contents</button>`;
        }
        a.innerHTML = prev + middle + next;
        const t = $('#timer-btn');
        if (t && running()) t.classList.add('running');
    }

    function doneButton(text) {
        return state.done[current.id]
            ? `<button type="button" class="btn good" data-act="done">✓ ${text}</button>`
            : `<button type="button" class="btn primary" data-act="done">${text}</button>`;
    }

    // ---- drawer ----

    function openDrawer(focusSearch) {
        renderDrawer();
        $('#drawer').classList.add('open');
        $('#drawer').setAttribute('aria-hidden', 'false');
        $('#backdrop').hidden = false;
        if (focusSearch) setTimeout(() => $('#search').focus(), 60);
    }
    function closeDrawer() {
        $('#drawer').classList.remove('open');
        $('#drawer').setAttribute('aria-hidden', 'true');
        $('#backdrop').hidden = true;
    }

    function row(it, sub) {
        const on = current && current.id === it.id;
        let right = '<span class="chev">›</span>';
        if (state.done[it.id]) right = '<span class="tick">✓</span>';
        else if (it.drills && it.drills.length) right = `<span class="count">${weekDone(it)}/${it.drills.length}</span>`;
        return `<button type="button" class="row${on ? ' on' : ''}" data-act="go" data-id="${esc(it.id)}">
            ${it.short ? `<span class="num">${esc(it.view === 'weeks' ? 'W' + it.short : it.short)}</span>` : ''}
            <span class="grow">${esc(it.title)}${sub ? `<small>${esc(sub)}</small>` : ''}</span>
            ${right}
        </button>`;
    }

    function sections(list) {
        const out = [];
        for (const it of list) {
            const last = out[out.length - 1];
            if (last && last.name === it.section) last.items.push(it);
            else out.push({ name: it.section, items: [it] });
        }
        return out;
    }

    function renderDrawer() {
        const body = $('#drawer-body');
        const scroll = body.scrollTop;
        let html = '';
        if (query) {
            const q = query.toLowerCase();
            const hits = items.filter((it) => it._text.includes(q));
            html += `<h4>${hits.length} ${hits.length === 1 ? 'page' : 'pages'}</h4>`;
            html += hits.length
                ? `<div class="panel">${hits.slice(0, 80).map((it) => row(it, it.view === 'drills' ? it.section : it.kicker || it.section)).join('')}</div>`
                : '<p class="fine">Nothing matches. Try one word, such as “baseline” or “caption”.</p>';
        } else {
            const v = view === 'today' ? 'weeks' : view;
            if (view === 'today') {
                html += '<h4>Today</h4><div class="panel"><button type="button" class="row on" data-act="go" data-id="today"><span class="grow">Today</span><span class="chev">›</span></button></div>';
            }
            if (v === 'drills') {
                const openSet = new Set(openWeeks());
                for (const s of sections(drills())) {
                    const open = openSet.has(s.name);
                    const n = s.items.filter((d) => state.done[d.id]).length;
                    html += `<div class="panel">
                        <button type="button" class="source-head${open ? '' : ' collapsed'}" data-act="fold" data-section="${esc(s.name)}">
                            <span class="chev">▾</span><span class="label">${esc(s.name)}</span><span class="count">${n}/${s.items.length}</span>
                        </button>
                        ${open ? s.items.map((d) => row(d, `${d.minutes} min · ${d.skill}`)).join('') : ''}
                    </div>`;
                }
            } else {
                for (const s of sections(inView(v))) {
                    html += `<h4>${esc(s.name)}</h4><div class="panel">${s.items.map((it) => row(it, v === 'weeks' && it.piece ? it.piece : '')).join('')}</div>`;
                }
            }
            html += `<h4>More</h4><div class="panel">
                <button type="button" class="menu-btn" data-act="print">🖨 Print / Save as PDF</button>
                <button type="button" class="menu-btn" data-act="export">⤓ Export notes</button>
                <button type="button" class="menu-btn" data-act="import">⤒ Import notes</button>
                <button type="button" class="menu-btn" data-act="help">⌨ Shortcuts</button>
                <a class="menu-btn" href="${esc(content.repo)}" target="_blank" rel="noopener">↗ Repository</a>
                <button type="button" class="menu-btn danger" data-act="reset">Reset this device</button>
            </div>`;
        }
        body.innerHTML = html;
        body.scrollTop = scroll;
        $('#drawer-foot').textContent = `${drills().filter((d) => state.done[d.id]).length} of 48 drills done · built ${content.built}`;
    }

    // ---- timer ----

    const running = () => Boolean(state.timerEnd && state.timerFor === (current && current.id));
    function fmt(ms) {
        const s = Math.max(0, Math.ceil(ms / 1000));
        return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    }
    function timerLabel() {
        if (running()) return `⏱ ${fmt(state.timerEnd - Date.now())}`;
        return `⏱ ${current.minutes}:00`;
    }
    function beep() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.frequency.value = 660;
            o.connect(g);
            g.connect(ctx.destination);
            g.gain.setValueAtTime(0.05, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            o.start();
            o.stop(ctx.currentTime + 0.5);
        } catch { /* sound blocked */ }
    }
    function runTimer() {
        clearTimeout(tick);
        if (!state.timerEnd) return;
        if (Date.now() >= state.timerEnd) {
            const id = state.timerFor;
            state.timerEnd = null;
            state.timerFor = null;
            save();
            beep();
            if (navigator.vibrate) navigator.vibrate([180, 80, 180]);
            toast(`Time is up${id ? ' on ' + id : ''}. Check your attempt against “Done when”.`);
            if (current && current.view === 'drills') renderActions();
            return;
        }
        const b = $('#timer-btn');
        if (b && running()) b.textContent = timerLabel();
        tick = setTimeout(runTimer, 250);
    }
    function toggleTimer() {
        if (!current || current.view !== 'drills') return;
        if (running()) {
            state.timerEnd = null;
            state.timerFor = null;
        } else {
            state.timerEnd = Date.now() + current.minutes * 60000;
            state.timerFor = current.id;
            markActivity();
        }
        save();
        renderActions();
        runTimer();
        if (running()) { const pad = $('#pad'); if (pad && pad.focus) pad.focus(); }
    }

    // ---- notes in and out ----

    function exportNotes() {
        const data = { app: 'techwriter', start: state.start, done: state.done, notes: state.notes, checks: state.checks, activity: state.activity };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `techwriter-notes-${iso(new Date())}.json`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }
    function importNotes(file) {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result);
                for (const key of ['done', 'notes', 'checks', 'activity']) {
                    if (data[key] && typeof data[key] === 'object') Object.assign(state[key], data[key]);
                }
                if (data.start && !state.start) state.start = data.start;
                save();
                toast('Notes imported');
                render();
            } catch { toast('That file is not a Techwriter notes export'); }
        };
        reader.readAsText(file);
    }

    function copyCode(btn) {
        const code = btn.closest('pre').querySelector('code');
        const text = code ? code.textContent : '';
        const ok = () => toast('Copied');
        if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(ok, () => toast('Copy failed'));
        else toast('Select the text to copy it');
    }

    // ---- events ----

    function act(el) {
        const d = el.dataset;
        switch (d.act) {
            case 'view': showView(d.view); break;
            case 'go': go(d.id); break;
            case 'step': step(Number(d.delta)); break;
            case 'drawer': openDrawer(false); break;
            case 'timer': toggleTimer(); break;
            case 'done':
                if (state.done[current.id]) delete state.done[current.id];
                else { state.done[current.id] = iso(new Date()); markActivity(); }
                if (state.done[current.id] && running()) { state.timerEnd = null; state.timerFor = null; }
                save();
                render();
                break;
            case 'begin':
                state.start = ($('#start-date') && $('#start-date').value) || iso(new Date());
                markActivity();
                save();
                render();
                break;
            case 'fold': {
                const set = new Set(openWeeks());
                set.has(d.section) ? set.delete(d.section) : set.add(d.section);
                state.open = [...set];
                save();
                renderDrawer();
                break;
            }
            case 'copy': copyCode(el); break;
            case 'print': closeDrawer(); setTimeout(() => window.print(), 250); break;
            case 'export': exportNotes(); break;
            case 'import': $('#import-file').click(); break;
            case 'help': closeDrawer(); $('#help-dialog').showModal(); break;
            case 'reset':
                if (!confirm('Delete the notes, ticks and progress stored on this device?')) return;
                state = { start: '', done: {}, notes: {}, checks: {}, activity: {}, open: null, timerEnd: null, timerFor: null };
                save();
                toast('This device is cleared');
                go('today');
                break;
            default: break;
        }
    }

    document.addEventListener('click', (e) => {
        const el = e.target.closest ? e.target.closest('[data-act]') : null;
        if (el && !el.disabled) act(el);
    });

    document.addEventListener('input', (e) => {
        if (e.target.id === 'search') {
            query = e.target.value.trim();
            renderDrawer();
        } else if (e.target.id === 'pad' && current) {
            state.notes[current.id] = e.target.value;
            markActivity();
            clearTimeout(save.timer);
            save.timer = setTimeout(save, 300);
            $('#word-count').textContent = `${words(e.target.value)} words`;
        }
    });

    document.addEventListener('change', (e) => {
        const t = e.target;
        if (t.id === 'start-date' && state.start && t.value) {
            state.start = t.value;
            save();
            render();
        } else if (t.dataset && t.dataset.check !== undefined && current) {
            const arr = state.checks[current.id] || [];
            arr[Number(t.dataset.check)] = t.checked;
            state.checks[current.id] = arr;
            markActivity();
            save();
        } else if (t.id === 'import-file' && t.files && t.files[0]) {
            importNotes(t.files[0]);
            t.value = '';
        }
    });

    document.addEventListener('keydown', (e) => {
        const typing = e.target.matches && e.target.matches('textarea, input');
        if (e.key === 'Escape') {
            if ($('#drawer').classList.contains('open')) closeDrawer();
            else if (typing) e.target.blur();
            return;
        }
        if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
        if (e.key === 'ArrowRight') step(1);
        else if (e.key === 'ArrowLeft') step(-1);
        else if (e.key === '/') { e.preventDefault(); openDrawer(true); }
        else if (e.key === 't' || e.key === 'T') toggleTimer();
        else if ((e.key === 'd' || e.key === 'D') && current && (current.pad)) act({ dataset: { act: 'done' } });
        else if ('1234'.includes(e.key)) showView(VIEWS[Number(e.key) - 1][0]);
    });

    $('#open-drawer').addEventListener('click', () => openDrawer(false));
    $('#open-search').addEventListener('click', () => openDrawer(true));
    $('#close-drawer').addEventListener('click', closeDrawer);
    $('#backdrop').addEventListener('click', closeDrawer);
    window.addEventListener('hashchange', route);

    // Swipe the page left or right, as in Sloka Words.
    let x0 = null;
    let y0 = null;
    const stage = $('#stage');
    stage.addEventListener('touchstart', (e) => {
        if (e.target.closest && e.target.closest('textarea, pre, .table-wrap, input')) { x0 = null; return; }
        x0 = e.touches[0].clientX;
        y0 = e.touches[0].clientY;
    }, { passive: true });
    stage.addEventListener('touchend', (e) => {
        if (x0 == null || !current) return;
        const dx = e.changedTouches[0].clientX - x0;
        const dy = e.changedTouches[0].clientY - y0;
        x0 = null;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
    }, { passive: true });

    async function init() {
        try {
            content = await (await fetch('content.json')).json();
        } catch {
            $('#stage').innerHTML = '<div class="empty">Could not load the program. Serve this folder over HTTP, not as a file.</div>';
            return;
        }
        items = content.items;
        byId = Object.fromEntries(items.map((it) => [it.id, it]));
        for (const it of items) {
            it._text = `${it.title} ${it.kicker} ${it.section} ${it.skill} ${it.summary} ${it.html.replace(/<[^>]+>/g, ' ')}`.toLowerCase();
        }
        route();
        runTimer();
        if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
            navigator.serviceWorker.register('sw.js').catch(() => {});
        }
    }
    init();
})();
