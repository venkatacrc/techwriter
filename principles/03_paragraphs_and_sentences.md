# 3. Paragraphs and sentences

Readers process text with expectations about where information sits. Meet those expectations and the reader spends their effort on your ideas; violate them and they spend it on your sentences. The principles below come mostly from George Gopen and Judith Swan's *The Science of Scientific Writing* (1990) and Joseph Williams's *Style: Lessons in Clarity and Grace*.

## Paragraphs

**One point per paragraph, stated first.** The first sentence (the topic sentence) states the point; the rest supports, qualifies or illustrates it. A reader who reads only first sentences should get the argument. When a paragraph makes a second point, start a new paragraph.

**Length follows the point.** In technical prose, 60–150 words is common. A 250-word paragraph usually holds two points; a run of one-sentence paragraphs usually means points with no support.

## Sentences: what goes where

**Characters as subjects, actions as verbs.** Readers expect the subject to be who or what acts, and the verb to be the action. Nouns made from verbs (*nominalisations*) hide both.

- Before: "The utilisation of a fused optimizer resulted in a reduction of the step time."
- After: "The fused optimizer reduced the step time."

**Keep subject and verb close.** Everything between them is held in working memory until the verb arrives.

- Before: "The data loader, which decodes JPEGs on 8 CPU worker processes and applies random crops and flips before collating each batch of 256 images, stalls the GPU."
- After: "The data loader stalls the GPU: it decodes JPEGs on only 8 CPU worker processes, then crops, flips and collates each 256-image batch."

**Old information first, new information last.** The start of a sentence (the *topic position*) should link back to what the reader already has; the end (the *stress position*) should carry the new and important information. This makes sentences chain:

- Before: "Throughput dropped by 30%. A synchronisation point was introduced by the `.item()` call in the logging code. The CPU waits for the GPU at every step because of it."
- After: "Throughput dropped by 30% after we added per-step logging. The logging code calls `.item()`, which is a synchronisation point. At every step, the CPU now waits for the GPU to finish before it can launch the next kernel."

In the revised version, each sentence starts with something the previous one introduced (*logging*, then *`.item()`*, then *synchronisation*) and ends on the new fact.

## Words

**Use one term per concept, always the same one.** In literary prose, varying synonyms is elegant. In technical prose it is a bug: if paragraph 2 says "program", paragraph 3 "block" and paragraph 4 "CTA" (cooperative thread array), the reader must wonder whether these are three things. Pick one, define it once, and keep it.

**Give "this" a noun.** "This is why the kernel is slow" makes the reader search backwards for the referent. "This bank conflict is why the kernel is slow" does not.

<!-- twlint: ignore filler -->
**Prefer the concrete word.** "Performance improved" → "step time fell from 41 ms to 29 ms". "Various optimisations" → "three optimisations: fused AdamW, CUDA graphs, and bf16 logits".

<!-- twlint: ignore filler -->
**Cut words that do no work.** *Very*, *really*, *basically*, *actually*, *in order to*, *it should be noted that*. The linter lists them; delete or replace each one it finds unless you can say what it adds.

**Hedge once, precisely, where the uncertainty is.** "It might perhaps be possible that this could help" is four hedges for one uncertainty. "On our two GPUs this helped; we have not tested other architectures" places the uncertainty and sizes it.

## Rhythm

Vary sentence length. A run of long sentences tires the reader; a run of short ones reads like a list. Put the most important idea of a paragraph in a short sentence, after a longer one that sets it up.

When items are parallel (steps, options, results), make the grammar parallel too, and consider a list. When items are related causally, keep them in prose: lists hide the "because".

## Active and passive

Use the active voice when the actor matters ("the scheduler evicts the oldest request"). The passive is correct when the actor is unknown or irrelevant ("the weights are stored in bf16"), and in methods sections where the experimenter is obvious. The linter flags passives for you to *look at*, not to remove by rule.
