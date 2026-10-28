# 1. The reader and the claim

Most unclear technical writing is not made of bad sentences. It is made of good sentences serving an unclear claim, written for nobody in particular. Fix those two things first; sentences come last.

## Name the reader

Before writing, answer four questions about one specific reader:

| Question | Weak answer | Useful answer |
|---|---|---|
| Who? | "ML engineers" | "Priya, who trains ranking models in PyTorch and has never written a kernel" |
| What do they know? | "the basics" | "autograd, mixed precision, profilers at the PyTorch-op level; not warps, not high-bandwidth memory" |
| What will they do after reading? | "understand X" | "decide whether to fuse their attention layer, and estimate the gain" |
| What makes them stop reading? | — | "three paragraphs of GPU history before the point" |

"Understand" is never the answer to the third question. Readers act: they adopt a technique, approve a budget, accept a paper, cite a result, or avoid a bug. Write for the action.

The main obstacle is the **curse of knowledge** (Steven Pinker's term in *The Sense of Style*): once you know something, you cannot easily imagine not knowing it. You skip steps that feel obvious, use your team's private vocabulary, and assume the reader saw the same plots you did. The reader card (drill D02) forces you to write down what they do *not* know.

## State a claim, not a topic

A **topic** names an area. A **claim** asserts something a reader could disagree with and could check.

- Topic: "This post discusses key–value (KV) cache memory management in large language model (LLM) serving."
- Claim: "Storing the KV cache in fixed-size pages, as an operating system pages virtual memory, removes most of the fragmentation that limits batch size, which is why vLLM's authors report 2–4× higher throughput than earlier serving systems at the same latency."

The claim tells the reader what to believe, why, and how strongly. It also tells *you* what evidence the piece needs: a fragmentation measurement, a batch-size effect, and a throughput comparison with a fair baseline.

Tests for a claim:

1. **Disagreeable.** Could a competent reader say "no"? "GPUs are important for deep learning" fails.
2. **Checkable.** Could a reader, in principle, verify or falsify it? "Our approach is more elegant" fails.
3. **Sized.** Does its strength match your evidence? "Always" needs a proof; "in our measurements on one GPU" needs only your logs.
4. **Owned.** Is the subject your work, and the verb something it does? "We show", "the kernel removes", "the policy learns", not "we study" or "this work is about".

## Activity versus contribution

Status reports describe activity: "We investigated several kernel fusion strategies and benchmarked them." Technical writing reports contribution: "Fusing the gate multiply into LayerNorm removes two of five memory passes and makes the layer 2× faster on GB200." Activity is what you did; contribution is what the reader gets. Readers do not care how hard you worked, only what is now true.

## The so-what ladder

A measured fact sits at the bottom of a ladder of consequences (illustrative numbers):

1. Decoding images on the GPU instead of in CPU workers raised GPU utilisation from 55% to 92%. *(fact)*
2. So the training step is no longer bound by the input pipeline. *(system)*
3. So an epoch takes 40% less wall-clock time on the same hardware. *(project)*
4. So the team can run the same experiment schedule on fewer GPUs. *(organisation)*
5. So input-pipeline throughput should be measured before any model-side optimisation. *(field)*

Different forms open on different rungs. A paper opens on rung 5 and proves rung 1. A white paper opens on rung 4. A blog post often opens on rung 1 as a hook, then climbs. Know which rung you are on (drill D03).

## Before you write anything longer than a page

Write these three lines at the top of the draft, and delete them only when the piece is done:

```text
Reader:   <one person, what they know, what they will do>
Claim:    <one sentence, disagreeable, checkable, sized>
Evidence: <the two or three things that make the claim true>
```

If you cannot fill in the claim, you are not ready to draft; you are ready to think, measure or outline. That is fine, and it is cheaper to find out now.
