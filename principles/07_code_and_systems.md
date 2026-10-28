# 7. Code and systems narratives

Writing about GPUs, training and inference systems is mostly writing about code and machines. Code in prose is evidence: it shows the reader exactly what was done. Systems stories (optimisation worklogs, debugging sessions, incidents) are the form readers in this field read most, and the hardest to make useful.

## Code excerpts

- **Say what to look for, then show it.** "The only change from the naive kernel is the mask on line 4, which keeps the last block from reading past the end:" then the code.
- **Show the smallest excerpt that carries the point.** Usually 5–15 lines. Elide the rest with a comment (`# ... load K and V as above ...`).
- **Prefer runnable code in blogs and pseudocode in papers.** Blog readers copy code; paper readers need the algorithm without your framework's boilerplate. In LaTeX, use an `algorithm` environment with numbered lines you can cite.
- **Make names in prose match names in code**, in monospace: `tl.atomic_add`, `max_queue_delay_microseconds`.
- **Link to the full code at a fixed version**: a commit hash or tag, not a branch that will change.
- **Commands must be copy-pasteable**: full commands, required environment variables, and the expected output or the line to look for.

## Explaining performance

A performance explanation names the bound, then shows the evidence for it:

1. **State the regime**: memory-bound, compute-bound, latency-bound, launch-bound, or communication-bound.
2. **Show the arithmetic**: bytes moved and FLOPs done, against the hardware's bandwidth and peak throughput (the roofline). "The kernel moves 3 GB in 0.42 ms, which is 7.1 TB/s against a measured copy ceiling of 6.6 TB/s: it is at the memory roof."
3. **Show the profile**: the tool output (profiler trace, Nsight counters) that confirms the regime.
4. **Then explain the change** and show the same evidence after it.

"It got faster because of better memory access" is a guess. "Coalesced loads cut device-memory (DRAM) transactions per request from 32 to 4, measured with Nsight Compute, and time fell in proportion" is an explanation.

## The worklog

A worklog tells the story of an optimisation as a sequence of steps. Each step has the same five parts: what you expected, what you did, what you measured, what surprised you, and what you concluded. Simon Boehm's CUDA matmul worklog is the model: every step has a number, and the surprises are stated as surprises. Put a summary table of all steps at the top, so the reader knows where the story ends before it begins.

## The postmortem

A postmortem explains a failure so that others can prevent the next one. Google's *Site Reliability Engineering* book describes the *blameless* postmortem: it assumes everyone acted reasonably given what they knew, and looks for the systemic causes. Structure (see `templates/postmortem.md`):

1. **Summary**: what broke, the impact, the root cause, in three sentences.
2. **Impact**: who or what was affected, for how long, measured.
3. **Timeline**: timestamped observations, hypotheses and actions, *including wrong hypotheses*. Wrong turns are where the reader learns how to debug.
4. **Root cause and mechanism**: why the failure happened, explained well enough that a reader could have predicted it.
5. **Contributing factors**: what made it worse or slower to find.
6. **What went well, what did not.**
7. **Action items**: specific, owned, dated.

Debugging stories from your own work (a hang caused by an autotune key, a backend that misread arrays from a newer numpy) make excellent postmortems even when no production system was involved.

## Design decision records

When you choose between designs, write down the context, the options considered, the decision, and its consequences, including the costs of the chosen option. One page is enough; many teams call this an architecture decision record (ADR). Six months later it answers "why did we do it this way?", and it is raw material for the design section of a paper.

## Versions and environments

Systems results expire with versions. Always record the hardware, driver, CUDA, framework and library versions, and the exact commit of your code. A result without versions cannot be reproduced and, a year later, cannot be trusted.
