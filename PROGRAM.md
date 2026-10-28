# The 12-week program

Each week trains **one** sub-skill. Daily drills isolate it; the weekly piece applies it to your own work; the weekly reading shows a professional doing it. The forms climb a ladder: sentence → paragraph → figure → explainer → blog → white paper → paper → submission.

**The cadence (every week):**

| Rhythm | Time | What | Feedback |
|---|---|---|---|
| Daily drill, 5 days | 25 min | `python tools/tw.py today`, then `tw drill` | `tw lint`, then the drill's *Done when* |
| Weekly piece | 2–3 h | The piece listed for the week, in `journal/` | `tw review` after 24 h, then `prompts/reviewer.md` |
| Weekly reading | 45 min | The exemplar for the week, with `reading/protocol.md` | Your reverse outline vs. the author's structure |
| Friday retro | 10 min | `tw stats`; write one line: what I will practise next week | — |

Rules that make this a discipline rather than a course:

1. **Write before you read the guide.** Do the drill cold, then read the principle file, then revise. The gap between the two versions is the lesson.
2. **Never edit while drafting.** Timer on, write, stop. Editing is a separate session.
3. **Cool off before reviewing.** 24 hours minimum. Fresh eyes read what you wrote, not what you meant.
4. **Ship on schedule.** A published 70% piece teaches more than a perfect draft in a folder. Weeks 6, 8 and 12 have external deadlines; keep them.
5. **No model answers.** Nobody, human or AI, writes your piece. Reviewers point at problems; you fix them.

Seed topics with facts and data from your own work are in `seeds/`. Use them, or bring your own (reinforcement learning (RL) experiments, training runs, systems at work); the same week structure applies.

---

## Week 1 · The reader and the claim
Every technical text answers two questions before anything else: *who is reading, and what do I want them to believe or do afterwards?* Most unclear writing is clear sentences in service of an unclear claim.

**Drills:** D01, D02, D03, D04
**Weekly piece:** a 400-word working note to a named colleague: what you built in the GPU-kernels course and the one result they should remember (seed S7 or S8).
**Read:** `principles/01_reader_and_claim.md`. Exemplar: Simon Peyton Jones, *How to write a great research paper* (talk and slides).

## Week 2 · Paragraphs and flow
A paragraph makes one point; its first sentence states it. Within and across sentences, put old information first and new information last, so each sentence hands the reader to the next.

**Drills:** D05, D06, D07, D08
**Weekly piece:** revise the week-1 note using a reverse outline. Keep both versions; write three sentences on what changed and why.
**Read:** `principles/03_paragraphs_and_sentences.md`. Exemplar: George Gopen and Judith Swan, *The Science of Scientific Writing* (American Scientist, 1990).

## Week 3 · Numbers and evidence
A number without its unit, baseline, conditions and spread is an anecdote. Technical readers check your evidence before they believe your prose.

**Drills:** D09, D10, D11, D12
**Weekly piece:** a 500-word results section for the fused attention kernel of the Hierarchical Sequential Transduction Unit (HSTU), including how the baseline was made fair (seed S2).
**Read:** `principles/04_numbers_and_evidence.md`. Exemplar: Gernot Heiser, *Systems Benchmarking Crimes* (web page); Horace He, *Making Deep Learning Go Brrrr From First Principles* (blog, 2022).

## Week 4 · Figures and tables
Draw the figure before writing the paragraph around it. One message per figure; the caption states that message.

**Drills:** D13, D14, D15, D16
**Weekly piece:** one figure made from your own logs (for example, step time vs. batch size from Lab 11, or hit rate (HR@10) per ablation from Lab 09), with a self-contained caption and the paragraph that cites it.
**Read:** `principles/06_figures_and_tables.md`. Exemplar: Claus Wilke, *Fundamentals of Data Visualization* (free online), chapters on choosing a visualization and on titles and captions.

## Week 5 · Explaining a mechanism
Explaining *why* something is fast, correct or broken is the core of technical writing about systems. A mechanism is a causal chain; each link must be stated and, where possible, measured.

**Drills:** D17, D18, D19, D20
**Weekly piece:** first full draft of blog post #1, *The atomics cliff* (seed S1), 1,000–1,500 words.
**Read:** `forms/blog.md`. Exemplar: Simon Boehm, *How to Optimize a CUDA Matmul Kernel for cuBLAS-like Performance: a Worklog* (blog, 2022).

## Week 6 · Math in prose
Mathematics in technical writing is prose with symbols in it. Define every symbol before use, read every equation as a sentence, and say what each equation is for before you show it.

**Drills:** D21, D22, D23, D24
**Weekly piece:** add a derivation section to blog post #1, or write a standalone 800-word derivation (seed S9: the HSTU attention backward, or the policy-gradient theorem if RL is your focus). **Publish blog post #1 this week.**
**Read:** `principles/05_math.md`. Exemplars: Paul Halmos, *How to Write Mathematics* (1970); Lilian Weng, *Policy Gradient Algorithms* (blog, 2018).

## Week 7 · Code and systems narratives
Code in prose is evidence, not decoration: show the smallest excerpt that carries the point, and say what to look at before showing it. Failures are the best systems stories; write them as blameless timelines with a mechanism.

**Drills:** D25, D26, D27, D28
**Weekly piece:** a postmortem, *Serving HSTU with Triton Inference Server without Docker* (seed S4), using `templates/postmortem.md`.
**Read:** `principles/07_code_and_systems.md`. Exemplar: the postmortem chapter of Google's *Site Reliability Engineering* book (free online), and two entries from Dan Luu's `post-mortems` collection on GitHub.

## Week 8 · The white paper
A white paper helps a decision-maker make one decision. It leads with the recommendation, quantifies the trade-offs, and answers the objections before they are raised.

**Drills:** D29, D30, D31, D32
**Weekly piece:** white paper draft, *Where the time goes in recommendation-model training on GPUs* (seed S5), 2,000–3,000 words. **Send it to one real reader by Friday.**
**Read:** `forms/whitepaper.md`. Exemplar: any NVIDIA GPU architecture white paper (for example the H100 Tensor Core GPU Architecture paper). Notice its structure; discount its tone.

## Week 9 · The paper I: abstract, introduction, related work
The introduction sells the problem and states the contributions; related work positions you, it does not survey. Write the abstract first and last.

**Drills:** D33, D34, D35, D36
**Weekly piece:** abstract, introduction with contribution list, and related-work section for a short paper on jagged fused attention for recommendation (seed S6).
**Read:** `forms/paper.md`. Exemplar: Tri Dao et al., *FlashAttention* (NeurIPS 2022): abstract and introduction, read twice, once for content and once for moves.

## Week 10 · The paper II: method and evaluation
The method section lets an expert reproduce your work; the evaluation answers the reader's questions in the order they will ask them.

**Drills:** D37, D38, D39, D40
**Weekly piece:** method and evaluation sections for the same paper, with research questions, setup, results, and threats to validity.
**Read:** `forms/paper.md` (evaluation part). Exemplar: Samuel Williams, Andrew Waterman and David Patterson, *Roofline: An Insightful Visual Performance Model for Multicore Architectures* (CACM, 2009).

## Week 11 · Review, revision, rebuttal
Revision is where writing gets good, and reviewing others is the fastest way to see your own faults.

**Drills:** D41, D42, D43, D44
**Weekly piece:** full revision pass of the paper (`principles/08_revision.md`), then get **one human review** and write a response to it.
**Read:** the reviews and author responses of one accepted paper on OpenReview in your area.

## Week 12 · Ship and re-form
Submit, then reuse: the same work becomes a talk, a blog post, a thread, a white paper. Each form is a rewrite, not a cut.

**Drills:** D45, D46, D47, D48
**Weekly piece:** submit the paper (arXiv, or a workshop: see `publishing/venues.md`) and write the blog-post version of it.
**Read:** *Attention Is All You Need* (Vaswani et al., 2017) side by side with the Google AI blog post announcing it (*Transformer: A Novel Neural Network Architecture for Language Understanding*, 2017). List what changed between the forms.

---

## After week 12

Keep the cadence; change the content.

- **Daily:** one drill, chosen from your weakest rubric row (`tw stats` and your review sheets tell you which).
- **Monthly:** one finished piece, rotating forms: blog, then explainer or postmortem, then white paper or paper section.
- **Quarterly:** one submission (paper, journal article, or a practitioner venue such as ACM Queue) and one talk.
- **Every piece:** a reverse outline before revising, and a 24-hour cool-off before review.
