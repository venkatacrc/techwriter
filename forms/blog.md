# Blog posts

**Reader:** a practitioner who found your post through search, a feed or a colleague, and will leave at the first paragraph that wastes their time.
**Decision they make:** whether to use your idea, code or result in their own work.
**Evidence bar:** reproducible by the reader. Numbers with conditions, code they can run, links to the full source at a fixed commit.
**Length:** 1,200–3,000 words. Longer is fine if every section earns its place; the reader's patience is the budget.

## What a good technical post does in its first 150 words

1. Names the reader's problem in their terms ("Your data loader keeps the GPU waiting and you don't know why").
2. States the result ("Six changes made the step 4× faster; two of them matter").
3. Says what the reader will be able to do after reading.

Do not open with history, a definition of deep learning, or how you got interested in the topic.

## Sub-genres

Each sub-genre has its own template in `templates/`.

| Sub-genre | Shape | Exemplars |
|---|---|---|
| **Explainer** (`explainer.md`) | One concept, built from what the reader knows; a worked example; where the intuition breaks | Jay Alammar, *The Illustrated Transformer*; Chris Olah, *Understanding LSTMs* <!-- twlint: ignore acronym -->; Lilian Weng's posts |
| **Worklog** (`blog.md`, worklog variant) | Summary table first, then steps: expected → did → measured → surprised → concluded | Simon Boehm, *How to Optimize a CUDA Matmul Kernel*; Horace He, *Making Deep Learning Go Brrrr From First Principles* |
| **Postmortem** (`postmortem.md`) | Summary, impact, timeline with wrong turns, mechanism, actions | Cloudflare's incident write-ups; Google's *Site Reliability Engineering* book, chapter 15 |
| **Results post** (`blog.md`) | Claim, setup, results with baselines, limitations, how to reproduce | Lab and company engineering blogs (PyTorch, Hugging Face, Anyscale, vLLM) |
| **Opinion or argument** | Thesis, the strongest counter-argument, evidence for each side, position | Rich Sutton, *The Bitter Lesson*; Andrej Karpathy, *A Recipe for Training Neural Networks* |

## Structure of a results or worklog post

1. **Title that states the finding**: "Pinned memory halved our data-loader stalls", not "Notes on data loading".
2. **Summary**: two or three sentences, with the main number and its baseline.
3. **Context**: only enough for the reader to see why the problem matters. One paragraph.
4. **The body**: in the reader's order (usually the explanation, then the evidence, then the detail).
5. **What did not work**, briefly. Readers trust posts that report failures.
6. **Limitations**: where the result stops applying (other hardware, shapes, scales).
7. **Reproduce it**: commands, versions, link at a fixed commit.

## Common failures

- **Chronological narrative** that makes the reader wait for the result (fix: summary first; `principles/02_structure.md`).
- **Screenshot of a terminal** in place of a table or a figure.
- **"X× faster"** without baseline, conditions or variance (`principles/04_numbers_and_evidence.md`).
- **Copied code that does not run** because an import, a version or a flag is missing.
- **Ending without a conclusion**, or ending with "Thanks for reading". End with what the reader should do now.

## Publishing

Publish on a site you control (GitHub Pages with Jekyll or Hugo, or your own domain) so links stay stable; cross-post to Medium, dev.to or Substack if you like, with a canonical link to the original. If the work was done for an employer, get approval first (`publishing/process.md`).
