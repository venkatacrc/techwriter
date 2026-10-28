# techwriter

A practice system for technical writing about GPUs, model training, inference, reinforcement learning (RL), systems, code and the mathematics behind them. It trains one skill at a time on your own work, across four forms: blog posts, white papers, conference papers and journal articles.

It is built on **deliberate practice**: short daily drills that isolate one sub-skill, a weekly piece that applies it to real material, feedback you can measure, and a schedule. There are no model answers to copy. The tools find mechanical faults; rubrics, cool-off reviews and human readers judge the rest.

## Quick start

Python 3.9 or later, standard library only.

```bash
python tools/tw.py start          # day 1 of week 1 is today
python tools/tw.py today          # this week's skill, today's drill, drafts ready for review
python tools/tw.py drill          # creates today's drill in journal/; set the timer it prints
python tools/tw.py lint journal/2026/2026-10-28-d01-*.md
python tools/tw.py done journal/2026/2026-10-28-d01-*.md --minutes 25
```

The weekly piece:

```bash
python tools/tw.py new blog atomics-cliff     # templates/blog.md -> journal/YYYY/...
# draft it; wait 24 hours
python tools/tw.py review journal/2026/....md # lint summary + rubric sheet + reverse outline
# then an outside critique without rewriting: prompts/reviewer.md
python tools/tw.py stats                      # streak, words, fix rate and rubric score per week
```

Other commands: `tw drills` (the catalogue), `tw drill D17` (a specific drill), `tw new KIND SLUG` with `KIND` one of `blog explainer postmortem whitepaper paper abstract adr review reading`.

## The weekly rhythm

| | Time | What |
|---|---|---|
| Daily, 5 days | 25 min | One drill on the week's skill |
| Weekly | 2–3 h | One piece from your own work |
| Weekly | 45 min | One exemplar, read as a writer (`reading/protocol.md`) |
| Friday | 10 min | `tw stats`, and one line: what to practise next |

`PROGRAM.md` lays out the 12 weeks: reader and claim, paragraphs, numbers, figures, mechanisms, mathematics, systems narratives, white paper, paper (two weeks), review and rebuttal, and shipping.

## Phone and Mac

The program also comes as two apps that read the same `web/content.json`.

**Web app, for the phone.** Open [venkatacrc.github.io/techwriter](https://venkatacrc.github.io/techwriter/) on the Pixel in Chrome, then ⋮ → **Install app** (or **Add to Home screen**). After the first load it works offline. The ☰ button opens the contents: the pages of the current view, search, and a **More** panel to print, export or import notes, and reset. Swipe the page left or right to move between pages.

```bash
python tools/build_web.py          # rebuild web/content.json after editing the Markdown
node tools/smoke_web.js            # render every page against a stub DOM
python -m http.server -d web 8765  # then open http://localhost:8765
```

**Mac app.** A SwiftUI app in `app/`, for macOS 14 or later. Build it on the Mac with Xcode or the Command Line Tools:

```bash
./scripts/build_app.sh             # writes build/Techwriter.app
open build/Techwriter.app
```

The sidebar lists the pages of the current view, with search at the top. Drills and weekly pieces open beside a writing pane with the **Done when** checklist. Shortcuts: ⌘1 to ⌘4 switch views, ⌘[ and ⌘] move between pages, ⌘T starts the timer, ⌘D marks a page done, ⌘P prints or saves a PDF.

Both apps keep notes and progress on the device. **Export notes** in one and **Import notes** in the other moves them across; the file format is the same. Set **Week 1 begins** to the day you ran `tw start`, and both pick the same drill as `tw today`. The journal of record is still the `tw` tools on your computer.

A push to `main` republishes the web app through GitHub Actions (Settings → Pages → Source: **GitHub Actions**).

## The rules

1. Write before you read the guide.
2. Never edit while drafting.
3. Cool off for 24 hours before reviewing.
4. Ship on schedule.
5. No model answers: reviewers point at problems; you fix them.

## Map

| Path | What |
|---|---|
| `PROGRAM.md` | The 12-week plan and what comes after |
| `drills/catalog.md` | 48 drills, each with a skill, a time box and **Done when** criteria |
| `principles/` | Eight short guides: reader and claim, structure, paragraphs and sentences, numbers and evidence, mathematics, figures and tables, code and systems, revision |
| `forms/` | What each form's reader decides and what evidence it needs: blog, white paper, paper, journal |
| `templates/` | Skeletons with prompts, no prose, for every kind of piece |
| `rubrics/` | 1–4 scoring by form; `tw review` builds a sheet from them |
| `seeds/` | Facts from your GPU kernels course, with sources and evidence gaps, plus slots for your RL, training and math work |
| `reading/` | The reading protocol and the exemplar list |
| `publishing/` | Venues, and the process from employer approval to rebuttal and revision |
| `prompts/reviewer.md` | An AI critique prompt that quotes and diagnoses but never rewrites |
| `tools/` | `tw.py` (the workflow), `twlint.py` (the linter), `build_web.py` (builds `web/content.json`) |
| `web/` | The web app for the phone and the browser |
| `app/`, `scripts/` | The Mac app and its build script |
| `journal/` | Your writing: drills, pieces, review sheets |

## The linter

`twlint.py` flags filler words, hedges, weasel words, vague claims with no number, comparisons with no baseline, undefined acronyms, repeated words, long sentences and long paragraphs. It ignores code, math, URLs and front matter. Each issue is either `fix` (almost always wrong) or `look` (often fine; decide). Suppress a deliberate exception with `<!-- twlint: ignore RULE -->` on the line or the line above, and add acronyms your readers know to `tools/known_acronyms.txt`.

The linter is a spell-checker for habits, not a judge of writing. A piece can be lint-clean and pointless. The rubric rows on reader, claim and evidence matter more than every lint rule together.

## Measuring progress

`tw stats` tracks practice volume (days, streak, words, minutes) and two quality signals per week: lint *fix* items per 1,000 words, which should fall in the first month and stay low, and the average rubric score from your review sheets, which should rise. The best signal is outside the tools: whether readers act on what you write, and what reviewers say about it.
