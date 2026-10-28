# 2. Structure

Structure is the order in which the reader meets your ideas. The writer's natural order is chronological ("first I tried, then I found"). The reader's useful order is usually the reverse: conclusion, then the evidence that supports it, then the detail for those who want it.

## Lead with the point

Put the answer before the reasoning. Military and business writers call this BLUF (bottom line up front); Barbara Minto's *pyramid principle* is the same idea, made recursive: the top of the document states the main point, each section states a supporting point at its top, each paragraph states its point in its first sentence.

Chronological outline of a post on activation checkpointing:

1. I was training a 1.3B model and ran out of memory.
2. I tried a smaller batch, which hurt throughput.
3. I read about checkpointing.
4. I implemented it and measured.
5. It saved memory at a compute cost.

Pyramid outline of the same post (illustrative numbers):

1. Checkpointing every second transformer block cut peak memory by 40% for a 20% slower step, which let me double the batch and finish 1.4× sooner overall.
2. Why it works: activations dominate memory, and recomputing them is cheaper than storing them.
3. How to choose what to checkpoint: the memory–compute trade-off per layer type.
4. The measurements, and when it does not pay.

The first outline makes the reader wait for the point and guess what to pay attention to. The second tells them on line one, so every later section reads as support.

Chronology has one legitimate use: when the *process* is the content (worklogs, postmortems, tutorials). Even then, state the outcome at the start so the reader knows where the story ends.

## Sections answer the reader's questions, in their order

List the questions your reader will ask, in the order they will ask them. That list is your outline. For a performance result a reader typically asks: what is faster, by how much, compared with what, why, does it hold elsewhere, what does it cost, and how do I use it. If your sections follow a different order, the reader carries open questions through the text, and loses track.

## Headings

- In blogs, explainers and white papers, **headings can state claims**: "Shared atomics serialise at L2" tells more than "Atomics". A reader skimming headings alone should get the argument.
- In papers, use the conventional skeleton (Introduction, Background, Design, Evaluation, Related Work, Conclusion) because reviewers navigate by it, but make *subsection* headings and paragraph leads informative.
- Never use a heading as the first sentence of a paragraph ("## Results" followed by "These are shown below"). The text under a heading must stand without it.

## Signposts and transitions

A signpost tells the reader where they are going ("Two effects explain the gap: occupancy and memory coalescing. We take them in turn."). A transition tells them how the next idea relates to the last: contrast (*but*, *however*), cause (*so*, *because*), addition (*also*), example (*for instance*), concession (*although*). If you cannot find the right transition word between two paragraphs, the relationship is unclear in your head, and reordering may help more than rewording.

## The reverse outline

The single most useful structural tool. After drafting, write one line per paragraph stating what it claims, without looking at your headings. Read the list alone. It shows:

- paragraphs making two points (split them),
- two paragraphs making the same point (merge them),
- points out of the reader's order (move them),
- points with no evidence (support or cut them),
- a missing step in the argument (write it).

Every self-review sheet that `tw review` creates includes a reverse outline. Do it every time.

## Length is a structural decision

Decide the length before drafting, from the form and the reader's time (see `forms/`). A 1,500-word post with four sections gives each about 350 words: that is three or four paragraphs per section. Knowing the budget stops one section from swallowing the piece.
