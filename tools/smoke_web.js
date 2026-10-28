// Render every page of web/app.js against a stub DOM. Fail on exceptions or missing text.
//   node tools/smoke_web.js
const fs = require("fs");
const path = require("path");
const web = path.join(__dirname, "..", "web");

const els = new Map();
function el(sel) {
  if (!els.has(sel)) {
    const store = {
      innerHTML: "", textContent: "", hidden: false, value: "", checked: false,
      dataset: {}, className: "", style: {}, files: [],
    };
    store.classList = {
      toggle() {}, add() {}, remove() {}, contains() { return false; },
    };
    store.addEventListener = () => {};
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
  addEventListener: (ev, fn) => { handlers[ev] = fn; },
  print: () => {},
  isSecureContext: false,
};
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
    if (handlers.hashchange) handlers.hashchange();
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
  const main = el("#main");
  if (!main.innerHTML.includes("Build the writing muscle")) errors.push(new Error("welcome screen did not render"));
  const go = (hash, expect) => {
    try { location.hash = hash; }
    catch (e) { errors.push(new Error(`${hash}: ${e.stack}`)); return; }
    if (expect && !main.innerHTML.includes(expect)) errors.push(new Error(`${hash}: missing “${expect}”`));
  };
  const fire = (type, target) => {
    try { for (const fn of handlers[type] || []) fn({ target }); }
    catch (e) { errors.push(e); }
  };
  for (const it of content.items) go(it.id, it.title.slice(0, 24));
  go("today", "Build the writing muscle");
  go("missing", "Build the writing muscle");

  const now = new Date();
  const drill = ["D01", "D02", "D03", "D04"][ordinal(now.getFullYear(), now.getMonth() + 1, now.getDate()) % 4];
  el("#startDate").value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  fire("click", { id: "begin", dataset: {}, closest: () => null, matches: () => false });
  if (!main.innerHTML.includes("Week 1 of 12") || !main.innerHTML.includes(drill)) {
    errors.push(new Error("today did not show week 1 and drill " + drill));
  }
  go("D01", "Done when");
  fire("input", { id: "pad", value: "Ten claims about the kernel.", dataset: {} });
  fire("click", { id: "doneBtn", dataset: {}, closest: () => null, matches: () => false });
  if (!main.innerHTML.includes("Done · undo")) errors.push(new Error("mark done did not stick"));
  go("week-1", "Weekly piece");
  go("D01", "Done when");
  if (el("#pad").value !== "Ten claims about the kernel.") errors.push(new Error("note was not saved: " + JSON.stringify(el("#pad").value)));
  el("#search").value = "atomics";
  fire("input", { id: "search", value: "atomics", dataset: {} });
  if (!el("#list").innerHTML.toLowerCase().includes("atomics") && !el("#list").innerHTML.includes("Explaining")) {
    errors.push(new Error("search missed the atomics pages"));
  }
  go("principles/05_math", "∑");
  // 2026-10-28 is ordinal 739917 in Python's datetime.date
  if (ordinal(2026, 10, 28) !== 739917) errors.push(new Error("ordinal " + ordinal(2026, 10, 28) + " != 739917"));
  if (errors.length) {
    for (const e of errors) console.error(e.stack || e);
    process.exit(1);
  }
  console.log(`smoke ok: ${content.items.length} pages`);
}, 30);
