# 4. Numbers and evidence

Technical readers check your evidence before they believe your prose. In GPU, systems, training and reinforcement learning (RL) writing, most evidence is a measurement, and most errors are in how a measurement is reported, not in the measurement itself.

## The five parts of a reported number

1. **Value**, with precision the spread supports.
2. **Unit.** "7.1" means nothing; "7.1 TB/s" means something.
3. **Baseline**: relative to what? "3× faster" than which implementation, version and configuration?
4. **Conditions**: hardware, software versions, shapes, dtype, batch size, dataset, and anything else that changes the number.
5. **Spread and count**: how many runs, and how much they varied.

<!-- twlint: ignore long-sentence -->
A sentence with all five (illustrative numbers): "On 8 H100 GPUs connected by NVLink, an all-reduce of 1 GiB of bf16 gradients takes 4.2 ms with NCCL 2.21 (median of 50 runs after 10 warm-up runs; range 4.1–4.4 ms), against 6.9 ms for the same all-reduce over PCIe on the same machine."

Not every sentence needs all five in-line: a setup section can state conditions once. But every number must be traceable to all five somewhere in the piece.

## Ratios and percentages

Ratios are where most reporting errors live.

- "50% faster" is ambiguous: does throughput rise 50%, or does time fall 50% (which is 2× throughput)? Report the two raw values, then the ratio.
- "3× less memory" is unclear; write "one third of the memory" or "4.2 GB → 1.4 GB".
- Average ratios with the **geometric mean**, not the arithmetic mean: the arithmetic mean of 2× and 0.5× is 1.25×, which claims a gain where there is none.
- Report latency with the **median and tail percentiles** (p50, p99), not the mean; one outlier moves a mean.

## Fair comparisons

Your result is only as strong as your baseline. A reviewer's first question is "did you beat a strawman?" Make the baseline strong, and say how:

- the strongest available implementation, at its current version, with its recommended settings;
- the same hardware, inputs, precision and batch size;
- the same tuning effort (if you autotuned yours, tune theirs);
- the same measurement method (warm-up, synchronisation, repetitions);
- and state what remains unfair in your favour.

Gernot Heiser's *Systems Benchmarking Crimes* lists the common failures: benchmarking a subset of workloads and implying the whole, reporting only relative numbers, no indication of variance, an improper or outdated baseline, measuring at unrealistic scale, and not explaining a surprising result. Read it once a year.

## Variance, seeds and significance

- **Systems measurements**: report repetitions, warm-up, and the statistic used (median, minimum, mean). GPU timings vary with clocks, temperature and other tenants on shared machines; say if the machine was shared.
- **Training results**: report the number of seeds and the spread across them. A one-point gain in a metric that varies by two points across seeds is not a result.
- **Reinforcement learning**: variance across seeds is large and the tooling for reporting it matters. Henderson et al., *Deep Reinforcement Learning that Matters* (AAAI 2018), showed how seeds and implementation details change conclusions. Agarwal et al., *Deep Reinforcement Learning at the Edge of the Statistical Precipice* (NeurIPS 2021), recommends interval estimates and robust aggregates such as the interquartile mean, instead of point estimates from a few runs.

## Match the strength of the words to the evidence

| Evidence | Language that fits |
|---|---|
| One run, one machine | "in our run", "we observed" |
| Repeated runs, one setup | "on this setup, the median ..." |
| Several setups or seeds, with intervals | "across N seeds", "on average", with the interval |
| A mechanism you measured at each link | "because" |
| A mechanism you inferred | "we believe", "likely", and say what would test it |
| A proof | "always", "for all" |

Overclaiming is the most common reason reviewers reject a paper whose experiments are fine. Underclaiming wastes good evidence. Size the claim.

## Precision

Report as many significant figures as the spread supports. If runs vary by ±3%, "7,142 GB/s" implies false precision; "7.1 TB/s" is honest. Keep raw values with full precision in a table or appendix for readers who want them.

## The claim–evidence table

For any piece longer than a page, keep a two-column table: every claim on the left, its evidence on the right (measurement and where it is logged, citation, derivation, or "none yet"). Every "none yet" must be measured, softened or cut before you publish. Drill D12 builds the habit.
