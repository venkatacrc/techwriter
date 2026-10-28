"""tw: the writing-practice command line. Python 3.9+ standard library only.

    python tools/tw.py start                  begin the 12-week program today (once)
    python tools/tw.py today                  this week's focus and today's drill
    python tools/tw.py drill [D07]            create today's drill file (or a chosen one)
    python tools/tw.py new KIND SLUG          new draft from templates/KIND.md
    python tools/tw.py lint FILE              mechanical checks (tools/twlint.py)
    python tools/tw.py review FILE            lint + rubric self-review sheet (after a 24 h cool-off)
    python tools/tw.py done FILE --minutes N  mark a piece finished and record time spent
    python tools/tw.py stats                  sessions, streak, words, lint trend, rubric scores
    python tools/tw.py drills                 list the drill catalog

KIND is one of the files in templates/ (blog, whitepaper, paper, postmortem, abstract, explainer, ...).
Everything you write goes to journal/; nothing here writes prose for you.
"""
import argparse
import datetime as dt
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
import twlint  # noqa: E402

JOURNAL = ROOT / "journal"
TEMPLATES = ROOT / "templates"
RUBRICS = ROOT / "rubrics"
CONFIG = ROOT / ".tw" / "config.json"
CATALOG = ROOT / "drills" / "catalog.md"
PROGRAM = ROOT / "PROGRAM.md"
COOL_OFF_HOURS = 24


# ---------------------------------------------------------------- helpers
def today():
    return dt.date.today()


def config():
    return json.loads(CONFIG.read_text()) if CONFIG.exists() else {}


def program_week(d=None):
    cfg = config()
    if "start" not in cfg:
        return None
    start = dt.date.fromisoformat(cfg["start"])
    return ((d or today()) - start).days // 7 + 1


def front_matter(text):
    m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    meta = {}
    if m:
        for line in m.group(1).splitlines():
            k, _, v = line.partition(":")
            if k.strip():
                meta[k.strip()] = v.strip()
    return meta, (text[m.end():] if m else text)


def set_front_matter(path, **updates):
    text = path.read_text()
    meta, body = front_matter(text)
    meta.update({k: str(v) for k, v in updates.items()})
    head = "\n".join(f"{k}: {v}" for k, v in meta.items())
    path.write_text(f"---\n{head}\n---\n{body}")


def parse_catalog():
    drills = {}
    if not CATALOG.exists():
        return drills
    text = CATALOG.read_text()
    for m in re.finditer(r"^### (D\d+)\s*[·:-]\s*(.+?)\n(.*?)(?=^### D\d+|\Z)", text, re.S | re.M):
        did, title, body = m.group(1), m.group(2).strip(), m.group(3)
        meta = dict(re.findall(r"^- (\w+):\s*(.+)$", body, re.M))
        weeks = [int(w) for w in re.findall(r"\d+", meta.get("weeks", ""))]
        drills[did] = {"id": did, "title": title, "skill": meta.get("skill", ""),
                       "minutes": meta.get("minutes", "25"), "weeks": weeks,
                       "body": re.sub(r"^- \w+:.*\n", "", body, flags=re.M).strip()}
    return drills


def parse_program():
    weeks = {}
    if not PROGRAM.exists():
        return weeks
    for m in re.finditer(r"^## Week (\d+)\s*[·:-]\s*(.+?)\n(.*?)(?=^## |\Z)", PROGRAM.read_text(), re.S | re.M):
        body = m.group(3)
        piece = re.search(r"^\*\*Weekly piece:\*\*\s*(.+)$", body, re.M)
        drill_line = re.search(r"^\*\*Drills:\*\*(.+)$", body, re.M)
        weeks[int(m.group(1))] = {"title": m.group(2).strip(),
                                  "drills": re.findall(r"D\d+", drill_line.group(1)) if drill_line else [],
                                  "piece": piece.group(1).strip() if piece else ""}
    return weeks


def journal_files():
    if not JOURNAL.exists():
        return []
    return sorted(p for p in JOURNAL.rglob("*.md") if not p.name.endswith(".review.md") and p.name != "README.md")


def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:60]


def fill(template, **values):
    for k, v in values.items():
        template = template.replace("{{" + k + "}}", str(v))
    return template


def todays_drill(week, drills, program):
    ids = program.get(week, {}).get("drills") or [d for d, x in drills.items() if week in x["weeks"]]
    if not ids:
        ids = sorted(drills)
    return drills[ids[today().toordinal() % len(ids)]] if ids else None


# ---------------------------------------------------------------- commands
def cmd_start(args):
    CONFIG.parent.mkdir(exist_ok=True)
    cfg = config()
    if "start" in cfg and not args.force:
        print(f"Program already started on {cfg['start']} (week {program_week()}). Use --force to restart.")
        return
    cfg["start"] = (args.date or today().isoformat())
    CONFIG.write_text(json.dumps(cfg, indent=1))
    print(f"Week 1 starts {cfg['start']}. Run: python tools/tw.py today")


def cmd_today(args):
    week = program_week()
    program, drills = parse_program(), parse_catalog()
    if week is None:
        print("Not started. Run: python tools/tw.py start")
        return
    w = program.get(min(week, max(program) if program else week), {})
    print(f"Week {week}: {w.get('title', '(beyond the 12-week program: keep the cadence)')}")
    if w.get("piece"):
        print(f"Weekly piece: {w['piece']}")
    d = todays_drill(week, drills, program)
    if d:
        print(f"\nToday's drill  {d['id']} · {d['title']}  ({d['minutes']} min, skill: {d['skill']})")
        made = sorted((JOURNAL / str(today().year)).glob(f"{today().isoformat()}-{d['id'].lower()}-*.md"))
        made = [p for p in made if not p.name.endswith(".review.md")]
        if not made:
            print(f"  start it:  python tools/tw.py drill {d['id']}")
        elif front_matter(made[0].read_text())[0].get("status") == "done":
            print("  done today.")
        else:
            print(f"  in progress: {made[0].relative_to(ROOT)}\n"
                  f"  finish it: python tools/tw.py done {made[0].relative_to(ROOT)} --minutes {d['minutes']}")
    due = [p for p in journal_files() if front_matter(p.read_text())[0].get("status") == "draft"
           and front_matter(p.read_text())[0].get("kind") != "drill"
           and (dt.datetime.now() - dt.datetime.fromtimestamp(p.stat().st_mtime)).total_seconds() > COOL_OFF_HOURS * 3600
           and not p.with_suffix(".review.md").exists()]
    if due:
        print("\nCooled off and ready for self-review:")
        for p in due:
            print(f"  python tools/tw.py review {p.relative_to(ROOT)}")


def cmd_drill(args):
    drills, program = parse_catalog(), parse_program()
    week = program_week() or 1
    d = drills.get(args.id.upper()) if args.id else todays_drill(week, drills, program)
    if not d:
        sys.exit(f"unknown drill {args.id}; run: python tools/tw.py drills")
    tpl = (TEMPLATES / "drill.md").read_text()
    out = JOURNAL / str(today().year) / f"{today().isoformat()}-{d['id'].lower()}-{slugify(d['title'])}.md"
    if out.exists():
        print(f"already exists: {out.relative_to(ROOT)}")
        return
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(fill(tpl, date=today().isoformat(), week=week, drill_id=d["id"], title=d["title"],
                        skill=d["skill"], minutes=d["minutes"], prompt=d["body"]))
    print(f"{out.relative_to(ROOT)}\nSet a {d['minutes']}-minute timer. Write first; do not edit until the timer ends.")


def cmd_new(args):
    tpl_path = TEMPLATES / f"{args.kind}.md"
    if not tpl_path.exists():
        kinds = ", ".join(sorted(p.stem for p in TEMPLATES.glob("*.md") if p.stem != "drill"))
        sys.exit(f"no template '{args.kind}'. Available: {kinds}")
    out = JOURNAL / str(today().year) / f"{today().isoformat()}-{args.kind}-{slugify(args.slug)}.md"
    if out.exists():
        sys.exit(f"already exists: {out.relative_to(ROOT)}")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(fill(tpl_path.read_text(), date=today().isoformat(), week=program_week() or "-",
                        title=args.slug.replace("-", " ")))
    print(out.relative_to(ROOT))


def cmd_lint(args):
    return twlint.main([str(f) for f in args.files] + (["--quiet"] if args.quiet else []))


def cmd_review(args):
    path = pathlib.Path(args.file)
    text = path.read_text()
    meta, _ = front_matter(text)
    kind = meta.get("kind", "")
    age_h = (dt.datetime.now() - dt.datetime.fromtimestamp(path.stat().st_mtime)).total_seconds() / 3600
    if age_h < COOL_OFF_HOURS and not args.now:
        print(f"Last edited {age_h:.0f} h ago. Reviews made before a {COOL_OFF_HOURS} h cool-off read what you meant, "
              f"not what you wrote. Come back later, or pass --now.")
        return
    issues, stats = twlint.lint(text, twlint.load_acronyms())
    print(f"lint: {stats['fix']} fix ({stats['fix_per_1000_words']} per 1000 words), {stats['look']} look, "
          f"{stats['mean_sentence_words']} words/sentence. Details: python tools/tw.py lint {path}")
    rubric = RUBRICS / f"{kind}.md"
    if not rubric.exists():
        rubric = RUBRICS / "general.md"
    sheet = path.with_name(path.stem + ".review.md")
    if sheet.exists():
        print(f"review sheet exists: {sheet}")
        return
    rows = re.findall(r"^\|\s*(R\d+)\s*\|\s*([^|]+?)\s*\|", rubric.read_text(), re.M)
    lines = [f"# Self-review: {meta.get('title', path.stem)}", "",
             f"Reviewed {dt.datetime.now():%Y-%m-%d %H:%M}, {age_h:.0f} h after last edit. Rubric: {rubric.relative_to(ROOT)}",
             f"Lint: {stats['fix']} fix, {stats['look']} look, {stats['words']} words.", "",
             "Score each row 1-4 (see the rubric for what each level means). Evidence = quote or line number.", "",
             "| Row | Criterion | Score | Evidence | Change I will make |", "|---|---|---|---|---|"]
    lines += [f"| {rid} | {crit} |  |  |  |" for rid, crit in rows]
    lines += ["", "## Reverse outline", "", "One line per paragraph: what it claims. Then check the order.", "",
              "1. ", "", "## One thing to practise next", "", ""]
    sheet.write_text("\n".join(lines))
    print(f"review sheet: {sheet}\nThen, for an outside critique (no rewriting): prompts/reviewer.md")


def cmd_done(args):
    path = pathlib.Path(args.file)
    updates = {"status": "done"}
    if args.minutes:
        updates["minutes"] = args.minutes
    set_front_matter(path, **updates)
    print(f"marked done: {path}")


def score_of(review):
    scores = [int(s) for s in re.findall(r"^\|\s*R\d+\s*\|[^|]*\|\s*([1-4])\s*\|", review.read_text(), re.M)]
    return round(sum(scores) / len(scores), 2) if scores else None


def cmd_stats(args):
    rows = []
    for p in journal_files():
        text = p.read_text()
        meta, _ = front_matter(text)
        try:
            d = dt.date.fromisoformat(meta.get("date", p.name[:10]))
        except ValueError:
            continue
        _, st = twlint.lint(text, twlint.load_acronyms())
        review = p.with_name(p.stem + ".review.md")
        rows.append({"date": d, "kind": meta.get("kind", "?"), "status": meta.get("status", "?"),
                     "minutes": int(meta.get("minutes") or 0), "words": st["words"],
                     "fix1k": st["fix_per_1000_words"], "score": score_of(review) if review.exists() else None,
                     "file": p})
    if not rows:
        print("No writing yet. Start with: python tools/tw.py today")
        return
    days = sorted({r["date"] for r in rows})
    streak, d = 0, today()
    while d in days or (streak == 0 and d - dt.timedelta(days=1) in days and d not in days):
        if d in days:
            streak += 1
        d -= dt.timedelta(days=1)
    print(f"{len(rows)} pieces on {len(days)} days, {sum(r['words'] for r in rows):,} words, "
          f"{sum(r['minutes'] for r in rows)} minutes logged, current streak {streak} days\n")
    cfg = config()
    start = dt.date.fromisoformat(cfg["start"]) if "start" in cfg else days[0]
    weeks = {}
    for r in rows:
        weeks.setdefault((r["date"] - start).days // 7 + 1, []).append(r)
    print(f"{'week':>4}  {'pieces':>6}  {'words':>6}  {'fix/1k words':>12}  {'rubric avg':>10}")
    for w in sorted(weeks):
        rs = weeks[w]
        words = sum(r["words"] for r in rs)
        fix = sum(r["fix1k"] * r["words"] for r in rs) / words if words else 0
        sc = [r["score"] for r in rs if r["score"] is not None]
        print(f"{w:>4}  {len(rs):>6}  {words:>6}  {fix:>12.1f}  {(sum(sc) / len(sc)) if sc else float('nan'):>10.2f}")
    kinds = {}
    for r in rows:
        kinds[r["kind"]] = kinds.get(r["kind"], 0) + 1
    print("\nby kind: " + ", ".join(f"{k} {n}" for k, n in sorted(kinds.items())))
    drafts = [r for r in rows if r["status"] == "draft" and r["kind"] != "drill"]
    if drafts:
        print("open drafts: " + ", ".join(str(r["file"].relative_to(ROOT)) for r in drafts))


def cmd_drills(args):
    for d in parse_catalog().values():
        print(f"{d['id']}  {d['title']:<44} {d['skill']:<14} {d['minutes']:>3} min  weeks {','.join(map(str, d['weeks']))}")


def main():
    ap = argparse.ArgumentParser(prog="tw", description="writing-practice tool")
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("start"); p.add_argument("--date"); p.add_argument("--force", action="store_true")
    p.set_defaults(fn=cmd_start)
    sub.add_parser("today").set_defaults(fn=cmd_today)
    p = sub.add_parser("drill"); p.add_argument("id", nargs="?"); p.set_defaults(fn=cmd_drill)
    p = sub.add_parser("new"); p.add_argument("kind"); p.add_argument("slug"); p.set_defaults(fn=cmd_new)
    p = sub.add_parser("lint"); p.add_argument("files", nargs="+"); p.add_argument("--quiet", action="store_true")
    p.set_defaults(fn=cmd_lint)
    p = sub.add_parser("review"); p.add_argument("file"); p.add_argument("--now", action="store_true")
    p.set_defaults(fn=cmd_review)
    p = sub.add_parser("done"); p.add_argument("file"); p.add_argument("--minutes", type=int); p.set_defaults(fn=cmd_done)
    sub.add_parser("stats").set_defaults(fn=cmd_stats)
    sub.add_parser("drills").set_defaults(fn=cmd_drills)
    args = ap.parse_args()
    return args.fn(args)


if __name__ == "__main__":
    sys.exit(main() or 0)
