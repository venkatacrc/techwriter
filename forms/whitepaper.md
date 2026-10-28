# White papers

**Reader:** a decision-maker (engineering director, architect, platform owner) and the technical lead they will forward it to. The first reads the executive summary; the second checks the evidence.
**Decision they make:** adopt, fund, change or stop something: a hardware purchase, a framework migration, a serving architecture, an investment in optimisation work.
**Evidence bar:** sufficient for the decision, honest about costs and risks. Measurements from your environment beat published benchmarks; cost per unit of work (dollars per million tokens, GPU-hours per training run) beats raw speed.
**Length:** 4–12 pages. The executive summary is one page at most.

## What makes a white paper different

A white paper argues for a decision. A paper argues for knowledge; a blog shares practice. Every section of a white paper should help the reader decide, and the paper must state what it recommends. A white paper that only "explores the landscape" is a survey with a sales tone, and readers notice.

## Structure (see `templates/whitepaper.md`)

1. **Executive summary.** Problem, recommendation, expected benefit with a number, cost, main risk. Writable as five sentences; readable alone.
2. **The problem, in the reader's terms.** Cost, time, risk or opportunity, measured: "Our training cluster is 35% GPU-busy; at current spend, the idle 65% costs ...".
3. **Options considered.** Including doing nothing. Each option with its benefits, costs and risks, evaluated against the same criteria.
4. **Evidence.** The measurements behind the comparison. Methods in enough detail for the technical lead to trust them; full detail in an appendix.
5. **Recommendation and plan.** What to do, in what order, who does it, how long it takes, how success will be measured.
6. **Risks and mitigations.** What could make the recommendation wrong, and what you will watch for.
7. **Appendices.** Benchmark methods, configuration, raw data.

## Writing for two readers

Write the executive summary and the section openings for the decision-maker: no jargon, numbers in business units, recommendation explicit. Write the evidence sections and appendices for the technical lead: full conditions, baselines, variance. Use the first sentence of each section for the decision-maker and the rest for the lead; that way, both can read the same document.

## Common failures

- **No recommendation**, or one hidden on page 9.
- **Options that are not real options**, set up to lose to the preferred one. Decision-makers trust a paper that steelmans the alternatives.
- **Vendor-benchmark evidence** in place of measurements on the reader's workload.
- **Speed without cost.** A 2× faster option that costs 3× more per hour is slower per dollar.
- **Missing risks.** Every recommendation has them; omitting them makes the reader find them, and then distrust everything else.

## Exemplars

The NVIDIA and AMD architecture white papers (for describing hardware precisely), the Google TPU and Meta infrastructure papers (for evidence about systems decisions), and internal design documents in the style of Google's design docs (for options-and-trade-offs structure). Read them for structure, not for tone; a vendor's white paper argues for its product, and yours should argue for the reader's decision.
