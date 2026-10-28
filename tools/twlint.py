"""Prose linter for technical writing. Python 3.9+ standard library only.

    python tools/twlint.py draft.md [more.md ...] [--json] [--quiet]

It flags what a machine can find reliably, so your own attention goes to
structure and argument. It never judges whether a claim is true or a section is
in the right place: that is what the rubrics and readers are for.

Skipped: YAML front matter, fenced code, inline code, $...$ / \\(...\\) /
\\[...\\] math, LaTeX math environments, HTML comments, Markdown link URLs.

Levels: "fix" (almost always worth changing) and "look" (often fine; check).
Suppress a rule on one line with  <!-- twlint: ignore RULE -->  on that line.
"""
import argparse
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
ACRONYM_FILE = ROOT / "tools" / "known_acronyms.txt"

HEDGES = ["might", "perhaps", "possibly", "somewhat", "arguably", "fairly", "quite", "rather",
          "relatively", "seems to", "appears to", "it seems", "kind of", "sort of", "more or less"]
FILLER = {
    "very": "cut it, or give the number",
    "really": "cut it",
    "actually": "cut it unless you are correcting a misconception",
    "basically": "cut it",
    "essentially": "cut it, or say what is approximated",
    "just": "cut it, unless you mean 'only'",
    "simply": "cut it: it tells the reader they should find this easy",
    "obviously": "cut it: if it is obvious, no need to say so; if not, it insults",
    "clearly": "cut it, or show the evidence that makes it clear",
    "of course": "cut it",
    "in order to": "write 'to'",
    "due to the fact that": "write 'because'",
    "a number of": "give the number, or write 'several'",
    "it is important to note that": "cut it and state the point",
    "it should be noted that": "cut it and state the point",
    "note that": "usually cut it and state the point",
    "the fact that": "usually rewrite without it",
    "utilize": "write 'use'",
    "utilization of": "write 'use of'",
    "leverage": "write 'use', unless you mean financial leverage",
    "in terms of": "say the actual relation",
    "at this point in time": "write 'now'",
    "has the ability to": "write 'can'",
    "is able to": "write 'can'",
    "plays a role in": "say what it does",
    "various": "name them, or cut it",
}
VAGUE = ["significantly", "dramatically", "substantially", "massively", "drastically", "vastly",
         "huge", "massive", "tremendous", "blazing", "lightning", "state-of-the-art",
         "orders of magnitude", "much faster", "much slower", "much better", "far better",
         "greatly", "considerably"]
WEASEL = ["it is known that", "it is well known", "it is widely believed", "studies show",
          "research shows", "experts", "many people", "some people", "it has been shown",
          "commonly accepted", "everyone knows"]
COMPARISON = re.compile(r"\b(faster|slower|speed-?ups?|better|worse|improv\w*|reduced|reduces|cuts?|lower|higher|"
                        r"outperform\w*|beats?|gains?)\b", re.I)
BASELINE = re.compile(r"\b(than|over|vs\.?|versus|relative to|compared (?:to|with)|baseline|from\b.*\bto\b|"
                      r"against|instead of)\b", re.I)
PASSIVE = re.compile(r"\b(is|are|was|were|be|been|being)\s+(\w+ly\s+)?(\w+ed|built|done|made|"
                     r"shown|seen|given|known|taken|written|chosen|found|run|set|kept|held|sent)\b", re.I)
VAGUE_THIS = re.compile(r"(?:^|[.!?]\s+)(This|That|These|Those|It)\s+(is|are|was|were|means|shows|"
                        r"allows|enables|makes|leads|results|causes|gives|lets)\b")
ACRONYM = re.compile(r"\b([A-Z][A-Z0-9]{1,6}s?)\b")
NUMBER_ALONE = re.compile(r"\b\d+(\.\d+)?\s*(x|×)(?!\w)")
DOUBLE = re.compile(r"\b(\w+)[ \t]+\1\b|\b(\w+)[ \t]*\n[ \t]*\2\b", re.I)

LONG_SENTENCE = 35
VERY_LONG_SENTENCE = 50
LONG_PARAGRAPH = 170


def load_acronyms():
    known = set()
    if ACRONYM_FILE.exists():
        for line in ACRONYM_FILE.read_text().splitlines():
            line = line.split("#")[0].strip()
            if line:
                known.update(line.split())
    return known


def mask_spans(text):
    """Replace code, math, comments and URLs with spaces, keeping offsets and newlines."""
    def blank(m):
        return re.sub(r"[^\n]", " ", m.group(0))

    patterns = [
        r"\A---\n.*?\n---\n",                        # front matter
        r"<!--\s*twlint:\s*off\s*-->.*?(?:<!--\s*twlint:\s*on\s*-->|\Z)",  # quoted material, e.g. drill prompts
        r"```.*?```",                                # fenced code
        r"<!--.*?-->",                               # html comments
        r"\$\$.*?\$\$",                              # display math
        r"\\\[.*?\\\]",
        r"\\begin\{(equation|align|gather|multline)\*?\}.*?\\end\{\1\*?\}",
        r"\\\(.*?\\\)",
        r"(?<![\\$])\$[^$\n]+\$",                    # inline $math$
        r"`[^`\n]+`",                                # inline code
        r"\]\([^)]*\)",                              # link targets
        r"https?://\S+",
    ]
    for p in patterns:
        text = re.sub(p, blank, text, flags=re.S)
    return text


def line_col(text, pos):
    line = text.count("\n", 0, pos) + 1
    col = pos - (text.rfind("\n", 0, pos) + 1) + 1
    return line, col


def sentences(prose):
    """Yield (start, end) spans of sentences in masked prose, ignoring headings/table rules."""
    for para in re.finditer(r"[^\n](?:.|\n(?!\s*\n))*", prose):
        block = para.group(0)
        if re.match(r"\s*(#|\|)", block):
            continue
        # list items and blockquote lines are separate units even without a full stop
        cuts = [0] + [m.start() + 1 for m in re.finditer(r"\n(?=\s*(?:[-*+]|\d+\.|>)\s)", block)] + [len(block)]
        for u0, u1 in zip(cuts, cuts[1:]):
            unit = block[u0:u1]
            base = para.start() + u0
            start = 0
            for m in re.finditer(r"(?<!\b[A-Za-z])(?<!\be\.g)(?<!\bi\.e)(?<!\bvs)(?<!\bet al)(?<!\bFig)(?<!\bEq)"
                                 r"[.!?][*_\"')\]]*(?=\s+[A-Z(\[\"'0-9*_]|\s*$)", unit):
                yield base + start, base + m.end()
                start = m.end()
            if unit[start:].strip():
                yield base + start, base + len(unit)


def lint(text, known):
    prose = mask_spans(text)
    lower = prose.lower()
    issues = []
    ignored = {}
    for i, line in enumerate(text.splitlines(), 1):
        m = re.search(r"twlint:\s*ignore\s+([\w,\- ]+)", line)
        if m:
            ignored[i] = {r.strip() for r in re.split(r"[,\s]+", m.group(1)) if r.strip()}

    def add(pos, level, rule, msg):
        ln, col = line_col(text, pos)
        if rule in ignored.get(ln, ()) or rule in ignored.get(ln - 1, ()):
            return
        issues.append({"line": ln, "col": col, "level": level, "rule": rule, "msg": msg})

    covered = []

    def phrase_hits(words, rule, level, msg_fn):
        for w in sorted(words, key=len, reverse=True):
            for m in re.finditer(r"(?<![\w-])" + re.escape(w) + r"(?![\w-])", lower):
                if any(a <= m.start() and m.end() <= b for a, b in covered):
                    continue
                covered.append((m.start(), m.end()))
                add(m.start(), level, rule, msg_fn(w))

    phrase_hits(FILLER, "filler", "fix", lambda w: f"'{w}': {FILLER[w]}")
    phrase_hits(HEDGES, "hedge", "look", lambda w: f"'{w}': hedge. Keep it only if the uncertainty is real, and then say why")
    phrase_hits(WEASEL, "weasel", "fix", lambda w: f"'{w}': who? Cite the source or state the evidence")

    n_words = 0
    n_sent = 0
    passive = 0
    for s, e in sentences(prose):
        sent = prose[s:e]
        words = re.findall(r"[A-Za-z0-9][\w'’-]*", sent)
        if not words:
            continue
        n_sent += 1
        n_words += len(words)
        if len(words) > VERY_LONG_SENTENCE:
            add(s + len(sent) - len(sent.lstrip()), "fix", "long-sentence",
                f"{len(words)} words in one sentence; split it")
        elif len(words) > LONG_SENTENCE:
            add(s + len(sent) - len(sent.lstrip()), "look", "long-sentence",
                f"{len(words)} words; can it be two sentences?")
        lw = sent.lower()
        for v in VAGUE:
            m = re.search(r"(?<![\w-])" + re.escape(v) + r"(?![\w-])", lw)
            if m and not re.search(r"\d", sent):
                add(s + m.start(), "fix", "vague-claim",
                    f"'{v}' with no number in the sentence: quantify it")
        if COMPARISON.search(sent) and re.search(r"\d", sent) and not BASELINE.search(sent):
            m = COMPARISON.search(sent)
            add(s + m.start(), "look", "no-baseline",
                f"'{m.group(0)}' with a number but no baseline: faster than what?")
        for m in NUMBER_ALONE.finditer(sent):
            if not BASELINE.search(sent):
                add(s + m.start(), "look", "ratio-no-baseline",
                    f"'{m.group(0).strip()}' ratio: state what it is relative to")
        for m in PASSIVE.finditer(sent):
            passive += 1
            add(s + m.start(), "look", "passive",
                f"'{m.group(0)}': passive. Fine if the actor is unknown or unimportant; otherwise name it")

    for m in VAGUE_THIS.finditer(prose):
        add(m.start(1), "look", "vague-this",
            f"'{m.group(1)} {m.group(2)}': {m.group(1).lower()} what? Add the noun")

    seen = set()
    for m in ACRONYM.finditer(prose):
        word = m.group(1)
        base = word[:-1] if word.endswith("s") and word[:-1].isupper() and len(word) > 2 else word
        if base in known or word in known or base in seen or not re.search(r"[A-Z]{2}", base):
            seen.add(base)
            continue
        seen.add(base)
        window = prose[max(0, m.start() - 120): m.end() + 120]
        defined = re.search(r"\([^)]*\b" + re.escape(base) + r"s?(?:@\w+)?\s*\)", window) or \
            re.search(re.escape(base) + r"s?[\"'”’]?\s*\([^)]{3,}\)", window)
        if not defined:
            add(m.start(), "fix", "acronym",
                f"'{base}' first use without definition: write 'Full Name ({base})', "
                f"or add it to tools/known_acronyms.txt if every reader knows it")

    for m in DOUBLE.finditer(prose):
        w = m.group(1) or m.group(2)
        if w.lower() not in {"that", "had", "is"}:
            add(m.start(), "fix", "repeated-word", f"'{w} {w}'")

    for para in re.finditer(r"[^\n](?:.|\n(?!\s*\n))*", prose):
        block = para.group(0)
        if re.match(r"\s*(#|\||[-*] |\d+\. )", block):
            continue
        n = len(re.findall(r"[A-Za-z0-9][\w'’-]*", block))
        if n > LONG_PARAGRAPH:
            add(para.start(), "look", "long-paragraph",
                f"{n}-word paragraph; does it make one point? Split at the second point")

    issues.sort(key=lambda d: (d["line"], d["col"]))
    stats = {
        "words": n_words,
        "sentences": n_sent,
        "mean_sentence_words": round(n_words / n_sent, 1) if n_sent else 0,
        "passive_per_100_sentences": round(100 * passive / n_sent, 1) if n_sent else 0,
        "fix": sum(i["level"] == "fix" for i in issues),
        "look": sum(i["level"] == "look" for i in issues),
    }
    stats["fix_per_1000_words"] = round(1000 * stats["fix"] / n_words, 1) if n_words else 0
    return issues, stats


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("files", nargs="+")
    ap.add_argument("--json", action="store_true", help="machine-readable output")
    ap.add_argument("--quiet", action="store_true", help="only 'fix' issues")
    args = ap.parse_args(argv)
    known = load_acronyms()
    out = {}
    for f in args.files:
        text = pathlib.Path(f).read_text()
        issues, stats = lint(text, known)
        if args.quiet:
            issues = [i for i in issues if i["level"] == "fix"]
        out[f] = {"issues": issues, "stats": stats}
        if not args.json:
            for i in issues:
                print(f"{f}:{i['line']}:{i['col']}: {i['level']:<4} {i['rule']:<17} {i['msg']}")
            s = stats
            print(f"\n{f}: {s['words']} words, {s['sentences']} sentences, "
                  f"{s['mean_sentence_words']} words/sentence, "
                  f"passive in {s['passive_per_100_sentences']}% of sentences, "
                  f"{s['fix']} fix ({s['fix_per_1000_words']} per 1000 words), {s['look']} look")
    if args.json:
        print(json.dumps(out, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
