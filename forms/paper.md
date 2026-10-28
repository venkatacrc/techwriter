# Conference and workshop papers

**Reader:** first, three to five reviewers with 20–50 papers each, reading yours in one or two sittings and deciding accept or reject; then researchers in your area deciding whether to cite, build on or compare against your work.
**Decision they make:** is this contribution new, correct, significant and well supported?
**Evidence bar:** the highest of the forms. Claims supported by experiments with fair baselines, ablations isolating each component, variance across runs, and enough detail to reproduce (ideally, an artifact that does).
**Length:** fixed by the venue (often 8–12 pages plus references for full papers, 4–6 for workshop papers). Check the current call for papers.

## The contribution is everything

A paper is a vehicle for a contribution: a new technique, a new analysis, a new system, a new measurement, or a new negative result. Before writing, state the contributions as a bulleted list of claims, each one testable (`principles/01_reader_and_claim.md`). Every section then supports one or more bullets. Simon Peyton Jones's talk *How to Write a Great Research Paper* puts it as: your paper conveys one ping, one clear idea.

## Structure (see `templates/paper.md`)

1. **Title**: specific; often names the technique and the result.
2. **Abstract**: problem, gap, approach, main result with a number, implication (drill D35, `templates/abstract.md`).
3. **Introduction** (1–1.5 pages): the problem and why it matters, why existing approaches fall short, the key insight, the contributions as bullets, the main result. Many reviewers decide here.
4. **Background and motivation**: only what the reader needs; often a measurement that motivates the design ("Figure 2: 61% of step time is spent waiting for input").
5. **Design / method**: the idea first, then the mechanism, then the details. Figures of the architecture or algorithm.
6. **Implementation**: what was built, on what, how large.
7. **Evaluation**: questions first ("Does X improve throughput? Where does the gain come from? How does it scale?"), then experimental setup, then one subsection per question. Fair baselines, ablations, variance, limitations.
8. **Related work**: grouped by approach, stating how yours differs from each group. Not a list of summaries.
9. **Conclusion**: the contribution restated with the main evidence; one or two sentences of future work at most.

## Systems papers versus ML papers

Systems venues (MLSys, OSDI, SOSP, ASPLOS, EuroSys) weigh design insight, real implementation and end-to-end measurements on realistic workloads. ML venues (NeurIPS, ICML, ICLR) weigh novelty of method, theoretical grounding where available, and evaluation across standard benchmarks with statistical care. The same work can be framed for either; choose the framing, and the venue, by which contribution is strongest.

## Common failures (from reviewers' complaints)

- **Unclear contribution**: the reviewer cannot say in one sentence what is new.
- **Weak baselines**: comparing an optimised method against an unoptimised baseline (`principles/04_numbers_and_evidence.md`, benchmarking crimes).
- **No ablation**: the gain is shown but not attributed.
- **Overclaiming**: "solves", "always", "general", supported by two models on one GPU.
- **Related work that hides the closest competitor**: reviewers know it, and will ask.
- **Figures that cannot be read** in print, or without colour.

## Further reading

<!-- twlint: ignore long-sentence -->
Simon Peyton Jones, *How to Write a Great Research Paper* (talk and slides); Jennifer Widom, *Tips for Writing Technical Papers*; Roy Levin and David Redell, *An Evaluation of the Ninth SOSP Submissions; or, How (and How Not) to Write a Good Systems Paper* (1983); Zachary Lipton and Jacob Steinhardt, *Troubling Trends in Machine Learning Scholarship* (2018).
