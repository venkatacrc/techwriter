#!/usr/bin/env python3
"""Build web/content.json and the app icons from the Markdown program.

    python tools/build_web.py

The web app is plain HTML, CSS and JavaScript. It reads content.json.
No math library: the LaTeX this program uses is rendered to HTML so the
app works offline, including on a phone.
"""
from __future__ import annotations

import datetime as dt
import html
import json
import re
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / "web"

SYMBOLS = {
    "alpha": "α", "beta": "β", "gamma": "γ", "delta": "δ", "epsilon": "ε", "theta": "θ",
    "lambda": "λ", "mu": "μ", "pi": "π", "rho": "ρ", "sigma": "σ", "tau": "τ",
    "phi": "φ", "omega": "ω", "Delta": "Δ", "Sigma": "Σ", "Omega": "Ω",
    "nabla": "∇", "partial": "∂", "infty": "∞", "in": "∈", "to": "→", "sim": "∼",
    "mid": "∣", "cdot": "·", "times": "×", "le": "≤", "ge": "≥", "neq": "≠",
    "approx": "≈", "pm": "±", "ldots": "…", "dots": "…", "cdots": "⋯",
    "lfloor": "⌊", "rfloor": "⌋", "langle": "⟨", "rangle": "⟩", "vert": "|",
    "sum": "∑", "prod": "∏", "int": "∫", "log": "log", "exp": "exp",
    "min": "min", "max": "max", "arg": "arg", "top": "ᵀ", "ell": "ℓ",
    "quad": " ", "qquad": "  ", ",": "\u2009", ";": " ", "!": "",
    " ": " ",
}
BB = {"R": "ℝ", "E": "𝔼", "N": "ℕ", "Z": "ℤ", "Q": "ℚ", "C": "ℂ"}
SKIP = {"left", "right", "big", "Big", "bigg", "Bigg", "bigl", "bigr", "Bigl", "Bigr"}

DRILL_IDS: set[str] = set()


def math(tex: str, display: bool = False) -> str:
    pos = 0

    def group() -> str:
        nonlocal pos
        while pos < len(tex) and tex[pos] == " ":
            pos += 1
        if pos >= len(tex):
            return ""
        if tex[pos] == "{":
            pos += 1
            return parse("}")
        if tex[pos] == "\\":
            return parse(None, single=True)
        ch = tex[pos]
        pos += 1
        return html.escape(ch)

    def parse(stop, single=False) -> str:
        nonlocal pos
        out = []
        while pos < len(tex):
            ch = tex[pos]
            if stop and ch == stop:
                pos += 1
                break
            if ch == "\\":
                m = re.match(r"\\([A-Za-z]+|.)", tex[pos:])
                name = m.group(1)
                pos += len(m.group(0))
                if name in ("mathrm", "text", "operatorname"):
                    out.append(f'<span class="mr">{group()}</span>')
                elif name == "mathbb":
                    g = re.sub(r"<[^>]+>", "", group())
                    out.append("".join(BB.get(c, c) for c in g))
                elif name == "frac":
                    num, den = group(), group()
                    out.append(f'<span class="frac"><span>{num}</span><span class="den">{den}</span></span>')
                elif name == "hat":
                    out.append(group() + "\u0302")
                elif name == "overline":
                    out.append(f'<span class="ovl">{group()}</span>')
                elif name in SKIP:
                    pass
                else:
                    out.append(SYMBOLS.get(name, html.escape(name)))
            elif ch in "^_":
                pos += 1
                tag = "sup" if ch == "^" else "sub"
                out.append(f"<{tag}>{group()}</{tag}>")
            elif ch in "{}":
                pos += 1
            else:
                out.append(html.escape(ch))
                pos += 1
            if single:
                break
        return "".join(out)

    cls = "math display" if display else "math"
    return f'<span class="{cls}">{parse(None)}</span>'


def link_drills(s: str) -> str:
    parts = re.split(r"(<[^>]+>)", s)

    def repl(m):
        did = m.group(1)
        if did not in DRILL_IDS:
            return did
        return f'<a class="inapp" href="#{did}">{did}</a>'

    return "".join(p if p.startswith("<") else re.sub(r"\b(D\d\d)\b", repl, p) for p in parts)


def inline(text: str) -> str:
    parts = re.split(r"(`[^`\n]+`|\\\(.+?\\\)|\\\[.+?\\\])", text)
    out = []
    for p in parts:
        if p.startswith("\\["):
            out.append(math(p[2:-2].strip(), display=True))
            continue
        if p.startswith("\\("):
            out.append(math(p[2:-2].strip()))
            continue
        if p.startswith("`") and p.endswith("`") and len(p) > 1:
            out.append(f"<code>{html.escape(p[1:-1])}</code>")
            continue
        p = html.escape(p, quote=False)
        p = re.sub(r"\[([^\]]+)\]\(([^)]+)\)",
                   r'<a href="\2" target="_blank" rel="noopener">\1</a>', p)
        p = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", p)
        p = re.sub(r"(?<![\w*])\*([^*\s][^*]*)\*(?![\w*])", r"<em>\1</em>", p)
        out.append(link_drills(p))
    return "".join(out)


def markdown(md: str) -> str:
    lines = md.strip("\n").split("\n")
    out, i = [], 0

    def list_at(i):
        items = []
        ordered = bool(re.match(r"\s*\d+\.", lines[i]))
        base = len(lines[i]) - len(lines[i].lstrip())
        while i < len(lines):
            line = lines[i]
            if not line.strip():
                break
            m = re.match(r"^(\s*)([-*]|\d+\.)\s+(.*)", line)
            if not m:
                if items and line.startswith(" "):
                    items[-1]["text"] += " " + line.strip()
                    i += 1
                    continue
                break
            indent = len(m.group(1))
            text = m.group(3)
            if indent >= base + 2 and items:
                items[-1]["sub"].append(text)
            elif indent < base:
                break
            else:
                items.append({"text": text, "sub": []})
            i += 1

        def render(rows, ord_):
            tag = "ol" if ord_ else "ul"
            body = []
            for it in rows:
                inner = inline(it["text"])
                if it["sub"]:
                    inner += render([{"text": s, "sub": []} for s in it["sub"]], False)
                body.append(f"<li>{inner}</li>")
            return f"<{tag}>" + "".join(body) + f"</{tag}>"

        return render(items, ordered), i

    while i < len(lines):
        line = lines[i]
        if line.startswith("```"):
            body = []
            i += 1
            while i < len(lines) and not lines[i].startswith("```"):
                body.append(lines[i])
                i += 1
            i += 1
            out.append(f"<pre><code>{html.escape(chr(10).join(body))}</code></pre>")
            continue
        if re.fullmatch(r"\s*---+\s*", line):
            out.append("<hr>")
            i += 1
            continue
        m = re.match(r"^(#{1,4})\s+(.*)", line)
        if m:
            level = len(m.group(1))
            slug = re.sub(r"[^a-z0-9]+", "-", m.group(2).lower()).strip("-")
            out.append(f'<h{level} id="{slug}">{inline(m.group(2))}</h{level}>')
            i += 1
            continue
        if line.startswith("|"):
            rows = []
            while i < len(lines) and lines[i].startswith("|"):
                rows.append([c.strip() for c in lines[i].strip().strip("|").split("|")])
                i += 1
            head, body = rows[0], [r for r in rows[1:] if not all(re.fullmatch(r":?-+:?", c) for c in r)]
            t = "<div class=\"table-wrap\"><table><thead><tr>" + "".join(
                f"<th>{inline(c)}</th>" for c in head) + "</tr></thead><tbody>"
            t += "".join("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>" for r in body)
            out.append(t + "</tbody></table></div>")
            continue
        if re.match(r"^\s*([-*]|\d+\.)\s+", line):
            block, i = list_at(i)
            out.append(block)
            continue
        if line.startswith(">"):
            quote = []
            while i < len(lines) and lines[i].startswith(">"):
                quote.append(lines[i][1:].strip())
                i += 1
            out.append(f"<blockquote>{inline(' '.join(quote))}</blockquote>")
            continue
        if not line.strip():
            i += 1
            continue
        if line.startswith("\x00note "):
            out.append(f'<p class="note">{inline(line[6:].strip())}</p>')
            i += 1
            continue
        para = []
        while i < len(lines) and lines[i].strip() and not re.match(
                r"^(#{1,4}\s|```|\||>|---+\s*$|\s*([-*]|\d+\.)\s)", lines[i]):
            if lines[i].startswith("\x00note "):
                break
            # A bold label at the start of a line ("**Drills:**") is its own paragraph.
            if para and re.match(r"^\*\*[A-Za-z]", lines[i]):
                break
            para.append(lines[i].strip())
            i += 1
        text = " ".join(para)
        if text.startswith("\x00note "):
            out.append(f'<p class="note">{inline(text[6:])}</p>')
        else:
            out.append(f"<p>{inline(text)}</p>")
    return "\n".join(out)


def prepare(md: str) -> str:
    def comment(m):
        inner = re.sub(r"\s+", " ", m.group(1)).strip()
        if not inner or "twlint" in inner:
            return ""
        return "\n\n\x00note " + inner + "\n\n"

    return re.sub(r"<!--(.*?)-->", comment, md, flags=re.S)


def front_matter(text: str):
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", text, re.S)
    if not m:
        return {}, text
    meta = {}
    for line in m.group(1).splitlines():
        k, _, v = line.partition(":")
        if k.strip():
            meta[k.strip()] = v.strip()
    return meta, m.group(2)


def render_md(text: str, keep_front: bool = False) -> str:
    meta, body = front_matter(text)
    body = prepare(body)
    body = re.sub(r"^# .+\n+", "", body, count=1)
    rendered = markdown(body)
    if keep_front and meta:
        rows = "".join(
            f"<tr><td><code>{html.escape(k)}</code></td><td><code>{html.escape(v)}</code></td></tr>"
            for k, v in meta.items())
        rendered = f'<div class="table-wrap"><table class="fm"><tbody>{rows}</tbody></table></div>\n' + rendered
    return rendered


def plain(md: str) -> str:
    md = re.sub(r"<!--.*?-->", "", md, flags=re.S)
    md = re.sub(r"`([^`]*)`", r"\1", md)
    md = re.sub(r"[*_#]", "", md)
    return re.sub(r"\s+", " ", md).strip()


def first_paragraph(md: str) -> str:
    md = re.sub(r"^# .+\n+", "", md)
    for block in re.split(r"\n\s*\n", md.strip()):
        line = block.strip()
        if line and not line.startswith(("#", "|", "-", "*", ">", "```")):
            return plain(line)
    return ""


def item(**kw):
    base = {"section": "", "kicker": "", "summary": "", "minutes": 0, "skill": "",
            "drills": [], "piece": "", "done": [], "pad": "", "short": ""}
    base.update(kw)
    return base


def build_items():
    global DRILL_IDS
    items = []

    program = (ROOT / "PROGRAM.md").read_text()
    week_m = re.search(r"^## Week 1\b", program, re.M)
    intro, rest = program[:week_m.start()], program[week_m.start():]
    chunks = re.split(r"(?=^## )", rest, flags=re.M)

    items.append(item(
        id="program", view="weeks", section="Start", kicker="Program",
        title="The 12-week program", summary=first_paragraph(intro),
        html=render_md(intro), short="",
    ))

    week_titles = {}
    for chunk in chunks:
        if not chunk.strip():
            continue
        wm = re.match(r"## Week (\d+)\s*·\s*(.+)\n(.*)\Z", chunk, re.S)
        if wm:
            n = int(wm.group(1))
            title = wm.group(2).strip()
            body = wm.group(3)
            week_titles[n] = title
            drill_line = re.search(r"^\*\*Drills:\*\*(.+)$", body, re.M)
            dids = re.findall(r"D\d+", drill_line.group(1)) if drill_line else []
            piece_m = re.search(r"^\*\*Weekly piece:\*\*\s*(.+)$", body, re.M)
            piece = piece_m.group(1).strip() if piece_m else ""
            DRILL_IDS.update(dids)
            items.append(item(
                id=f"week-{n}", view="weeks", section="Weeks", kicker=f"Week {n}",
                title=title, summary=first_paragraph(body), minutes=0,
                drills=dids, piece=plain(piece), pad="draft", short=str(n),
                html=render_md(f"# {title}\n\n{body}"),
            ))
            continue
        am = re.match(r"## (.+)\n(.*)\Z", chunk, re.S)
        if am and am.group(1).startswith("After"):
            items.append(item(
                id="after", view="weeks", section="Weeks", kicker="After week 12",
                title=am.group(1).strip(), summary=first_paragraph(am.group(2)),
                html=render_md(chunk),
            ))

    # Drills. Parse before other pages so Dxx links resolve, but the week
    # pages above were rendered before DRILL_IDS was complete. Re-render them
    # at the end once every drill id is known.
    catalog = (ROOT / "drills" / "catalog.md").read_text()
    for m in re.finditer(r"^### (D\d+)\s*[·:-]\s*(.+?)\n(.*?)(?=^### D\d+|\Z)", catalog, re.S | re.M):
        did, title, body = m.group(1), m.group(2).strip(), m.group(3)
        DRILL_IDS.add(did)
        meta = dict(re.findall(r"^- (\w+):\s*(.+)$", body, re.M))
        weeks = [int(w) for w in re.findall(r"\d+", meta.get("weeks", ""))]
        prompt = re.sub(r"^- \w+:.*\n", "", body, flags=re.M).strip()
        done_m = re.search(r"\*\*Done when:\*\*\s*(.+)", prompt, re.S)
        done = []
        if done_m:
            prompt = prompt[:done_m.start()].strip()
            done = [p.strip().rstrip(".") for p in re.split(r";\s+", done_m.group(1).strip()) if p.strip()]
        first = weeks[0] if weeks else 0
        section = f"Week {first} · {week_titles.get(first, '')}".strip(" ·")
        items.append(item(
            id=did, view="drills", section=section, kicker=did,
            title=title, summary=plain(prompt)[:240],
            minutes=int(meta.get("minutes") or 25), skill=meta.get("skill", ""),
            drills=[], piece="", done=done, pad="attempt", short=did, weeks=weeks,
            html=render_md(f"# {title}\n\n{prompt}\n"),
        ))

    library = [
        ("readme", "Using the tools", "Start", ROOT / "README.md", False),
        ("journal/README", "The journal", "Start", ROOT / "journal" / "README.md", False),
    ]
    for p in sorted((ROOT / "principles").glob("*.md")):
        library.append((f"principles/{p.stem}", None, "Principles", p, False))
    for p in sorted((ROOT / "forms").glob("*.md")):
        library.append((f"forms/{p.stem}", None, "Forms", p, False))
    for p in sorted((ROOT / "templates").glob("*.md")):
        library.append((f"templates/{p.stem}", p.stem.capitalize() + " template", "Templates", p, True))
    for p in sorted((ROOT / "rubrics").glob("*.md")):
        library.append((f"rubrics/{p.stem}", None, "Rubrics", p, False))
    library.append(("seeds/README", "Seeds", "Seeds", ROOT / "seeds" / "README.md", False))
    for p in sorted((ROOT / "reading").glob("*.md")):
        library.append((f"reading/{p.stem}", None, "Reading", p, False))
    for p in sorted((ROOT / "publishing").glob("*.md")):
        library.append((f"publishing/{p.stem}", None, "Publishing", p, False))
    library.append(("prompts/reviewer", "Reviewer prompt", "Publishing", ROOT / "prompts" / "reviewer.md", False))

    for iid, title, section, path, keep_front in library:
        text = path.read_text()
        if title is None:
            hm = re.search(r"^#\s+(.+)$", text, re.M)
            title = hm.group(1).strip() if hm else path.stem
        items.append(item(
            id=iid, view="library", section=section, kicker=section, title=title,
            summary=first_paragraph(front_matter(text)[1]),
            html=render_md(text, keep_front=keep_front),
        ))

    by_id = {it["id"]: it for it in items}
    # Week pages were rendered before every drill id was known.
    for it in items:
        if it["view"] == "weeks" and it["id"] != "program":
            pass
    rerender_weeks(items, program, week_m)
    return items


def rerender_weeks(items, program, week_m):
    """Second pass so D01-style links exist inside week pages."""
    intro, rest = program[:week_m.start()], program[week_m.start():]
    by = {it["id"]: it for it in items}
    by["program"]["html"] = render_md(intro)
    for chunk in re.split(r"(?=^## )", rest, flags=re.M):
        wm = re.match(r"## Week (\d+)\s*·\s*(.+)\n(.*)\Z", chunk, re.S)
        if wm:
            by[f"week-{wm.group(1)}"]["html"] = render_md(f"# {wm.group(2).strip()}\n\n{wm.group(3)}")
        elif chunk.startswith("## After"):
            by["after"]["html"] = render_md(chunk)


RESOLVE = {
    "PROGRAM.md": "program",
    "README.md": "readme",
    "seeds/": "seeds/README",
    "seeds/README.md": "seeds/README",
}


def rewrite_links(items):
    ids = {it["id"] for it in items}

    def resolve(path: str):
        path = path.strip()
        if path in RESOLVE and RESOLVE[path] in ids:
            return RESOLVE[path]
        key = path[:-3] if path.endswith(".md") else ""
        return key if key in ids else ""

    def repl_a(m):
        href, text = m.group(1), m.group(2)
        if href.startswith(("http", "#", "mailto")):
            return m.group(0)
        key = resolve(href)
        if key:
            return f'<a class="inapp" href="#{key}">{text}</a>'
        return m.group(0)

    def repl_code(m):
        path = m.group(1)
        key = resolve(path)
        if not key:
            return m.group(0)
        return f'<a class="inapp" href="#{html.escape(key)}"><code>{html.escape(path)}</code></a>'

    for it in items:
        h = re.sub(r'<a href="([^"]+)"[^>]*>(.*?)</a>', repl_a, it["html"])
        h = re.sub(r"<code>([^<]*\.md|seeds/)</code>", repl_code, h)
        it["html"] = h


def self_check(items):
    by = {i["id"]: i for i in items}
    weeks = [i for i in items if i["id"].startswith("week-")]
    drills = [i for i in items if i["view"] == "drills"]
    if len(weeks) != 12:
        raise SystemExit(f"expected 12 weeks, got {len(weeks)}")
    if len(drills) != 48:
        raise SystemExit(f"expected 48 drills, got {len(drills)}")
    math_html = by["principles/05_math"]["html"]
    seeds = by["seeds/README"]["html"]
    for needle, blob, label in (
        ("∑", math_html, "sum"),
        ("𝔼", math_html, "blackboard E"),
        ('class="frac"', seeds, "fraction"),
        ("SiLU", seeds, "mathrm name"),
        ("<ul>", by["reading/protocol"]["html"], "nested list"),
    ):
        if needle not in blob:
            raise SystemExit(f"missing {label} ({needle})")
    for it in items:
        if "mathbb" in it["html"] or "\\frac" in it["html"] or "\\(" in it["html"]:
            raise SystemExit(f"raw math left in {it['id']}")
        for href in re.findall(r'href="#([^"]+)"', it["html"]):
            if href not in by:
                raise SystemExit(f"broken link in {it['id']}: #{href}")
    if "<ul>" not in by["reading/protocol"]["html"].split("List the moves")[-1]:
        raise SystemExit("nested list under 'List the moves' did not render")


def write_png(path: Path, size: int):
    """Full-bleed icon so a phone's maskable crop still shows the page."""
    w = h = size
    bg, paper, ink, rule = (28, 25, 23, 255), (244, 241, 234, 255), (181, 71, 29, 255), (28, 25, 23, 255)
    buf = bytearray(bg * (w * h))

    def setp(x, y, c):
        i = (y * w + x) * 4
        buf[i:i + 4] = bytes(c)

    x0, y0, x1, y1 = int(w * 0.30), int(h * 0.24), int(w * 0.70), int(h * 0.76)
    for y in range(y0, y1):
        for x in range(x0, x1):
            setp(x, y, paper)
    for n, frac in enumerate((0.40, 0.50, 0.60)):
        y = int(h * frac)
        thick = max(2, size // 48)
        color = ink if n == 0 else rule
        x_end = int(w * (0.62 if n == 0 else 0.58))
        for t in range(thick):
            for x in range(int(w * 0.36), x_end):
                setp(x, y + t, color)

    raw = b"".join(b"\x00" + bytes(buf[y * w * 4:(y + 1) * w * 4]) for y in range(h))

    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    ihdr = struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0)
    path.write_bytes(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))


def main():
    items = build_items()
    rewrite_links(items)
    self_check(items)
    blurb = plain((ROOT / "README.md").read_text().split("\n\n")[1])
    payload = {
        "built": dt.date.today().isoformat(),
        "repo": "https://github.com/venkatacrc/techwriter",
        "blurb": blurb,
        "items": items,
    }
    WEB.mkdir(exist_ok=True)
    (WEB / "content.json").write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")))
    write_png(WEB / "icon-192.png", 192)
    write_png(WEB / "icon-512.png", 512)
    n = sum(len(i["html"]) for i in items)
    print(f"web/content.json: {len(items)} items, {n} bytes of HTML, built {payload['built']}")


if __name__ == "__main__":
    main()
