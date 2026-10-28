# Drill catalog

Each drill isolates one sub-skill and takes 15–30 minutes. There are no sample answers: the **Done when** list is the standard, and you check your own work against it after the timer ends (`tw lint` handles the mechanical part). Start a drill with `python tools/tw.py drill Dxx`.

Material: use your own work. Where a drill needs facts, `seeds/` has them (S1–S12). Rotate seeds so you are not always writing about the same result.

---

## Week 1: the reader and the claim

### D01 · One-sentence claim
- skill: claim
- minutes: 15
- weeks: 1, 9
Pick one piece of your work. Write ten different one-sentence claims about it, each under 30 words, each something a reader could disagree with. Then circle the one you would bet on.

**Done when:** every sentence has a subject that is your work and a verb that is not "is about" or "discusses"; at least three contain a number; the circled one names what changes for the reader.

### D02 · Reader card
- skill: reader
- minutes: 15
- weeks: 1, 8
For one piece you plan to write, fill in: who exactly is the reader (a named person if possible); what they already know; what they do not know; what they will do after reading; what would make them stop reading. Then write the first sentence of the piece for that reader.

**Done when:** the reader is specific enough that a stranger could find such a person; the "will do after reading" is an action, not "understand"; the first sentence uses only words that reader already knows.

### D03 · So-what ladder
- skill: claim
- minutes: 20
- weeks: 1, 5
Start from one measured fact (for example "the backward kernel went from 33 ms to 0.47 ms"). Ask "so what?" and answer in one sentence. Repeat five times, each answer one level higher in consequence (kernel → step → training run → team → field).

**Done when:** each rung follows causally from the one below; you can say which rung each of your planned forms (blog, white paper, paper) should open on.

### D04 · Elevator versions
- skill: claim
- minutes: 20
- weeks: 1, 12
Explain the same piece of work in exactly 1 sentence, 3 sentences, and 100 words. Do it for two readers: a GPU engineer and an engineering manager.

**Done when:** all six versions share the same core claim; the manager versions contain no term the manager would have to look up; the engineer versions contain at least one number.

---

## Week 2: paragraphs and flow

### D05 · Topic sentence first
- skill: paragraph
- minutes: 20
- weeks: 2
Take a paragraph you wrote in the last month (a doc, PR description, email). Write its point in one sentence. If that sentence is not the paragraph's first sentence, rewrite the paragraph so it is, and cut every sentence that does not support it.

**Done when:** a reader who reads only first sentences of your rewritten paragraphs gets the argument; nothing in the paragraph is off-point.

### D06 · Given-new chain
- skill: flow
- minutes: 20
- weeks: 2
Write a 6-sentence explanation of one mechanism (for example why a scalar CUDA copy is slower than a float4 copy). Each sentence must begin with something mentioned in the previous sentence and end with the new information.

**Done when:** you can draw an arrow from the end of each sentence to the start of the next; the most important word of each sentence is at its end (the stress position).

### D07 · Reverse outline
- skill: structure
- minutes: 25
- weeks: 2, 11
Take any draft longer than 500 words (yours). Without looking at headings, write one line per paragraph saying what it claims. Then read the list alone.

**Done when:** you have marked every paragraph that makes two points, every pair making the same point, and every place the order of the list differs from the order a reader needs; you have written the new order.

### D08 · Nominalization hunt
- skill: sentence
- minutes: 15
- weeks: 2
<!-- twlint: ignore filler -->
In a paragraph of yours, underline every noun that hides a verb ("the optimization of", "performs a reduction", "the utilization of"). Rewrite each sentence with the real actor as subject and the action as verb.

**Done when:** every rewritten sentence has a concrete subject that does something; the paragraph is shorter; meaning is unchanged.

---

## Week 3: numbers and evidence

### D09 · A number with its context
- skill: numbers
- minutes: 15
- weeks: 3
Pick five numbers from your logs. For each, write one sentence that gives the value, unit, what it is relative to, the conditions (hardware, shape, dtype, batch), and how it was measured.

**Done when:** each sentence passes the "could a stranger reproduce or falsify this?" test; no "x faster" without "than what".

### D10 · Fair-comparison paragraph
- skill: evidence
- minutes: 25
- weeks: 3, 10
Write the paragraph that convinces a skeptical reviewer that your baseline is fair (seed S2 or your own). Say what the baseline is, why it is the right one, what you did to make it strong, and what remains unfair in your favour.

**Done when:** the paragraph names at least one way the comparison could still be biased toward you; a reviewer could not say "you beat a strawman".

### D11 · Variance and uncertainty
- skill: evidence
- minutes: 20
- weeks: 3
Take one result where you have repeated measurements (or rerun something three times now). Report it with the spread, the number of runs, and what varies between runs. Then write one sentence on whether the difference you care about is larger than the noise.

**Done when:** the result states n, a central value and a spread; the claim is sized to the evidence (no "consistently" from two runs).

### D12 · Claim–evidence table
- skill: evidence
- minutes: 25
- weeks: 3, 10
For one piece you are writing, list every claim in the left column of a table and the evidence for it in the right (measurement, citation, derivation, or "none yet").

**Done when:** every "none yet" is either deleted, softened to match what you have, or added to a to-measure list.

---

## Week 4: figures and tables

### D13 · Caption that stands alone
- skill: figures
- minutes: 15
- weeks: 4
Write captions for three figures or tables you have (or could make from your logs). Each caption must state the takeaway first, then what is plotted, units, conditions, and what the error bars mean.

**Done when:** a reader who sees only the figure and caption, not the text, knows what to conclude and how much to trust it.

### D14 · Figure before prose
- skill: figures
- minutes: 25
- weeks: 4
Before writing a results section, sketch on paper (or in a plotting notebook) the one figure that carries its main claim. Only then write the paragraph that cites it.

**Done when:** the paragraph says what to look at in the figure ("the gap between the two lines grows with N"), not only "see Figure 2".

### D15 · Table or plot?
- skill: figures
- minutes: 20
- weeks: 4
Take one dataset from your work and present it twice: as a table and as a plot. Write two sentences on which serves the reader's question better and why.

**Done when:** you have named the reader's question; your choice follows from it (lookup of exact values favours tables, trends and comparisons favour plots).

### D16 · Redesign a bad figure
- skill: figures
- minutes: 25
- weeks: 4
Find a figure (yours or published) that is hard to read. List its problems, then sketch a redesign that carries one message.

**Done when:** your list covers axes and units, encoding (colour, marker, position), clutter, and whether the message is visible in two seconds.

---

## Week 5: explaining a mechanism

### D17 · Three readers, one mechanism
- skill: explanation
- minutes: 30
- weeks: 5
Explain one mechanism (for example why shared-address atomics serialise) three times: to a first-year computer science student (150 words), to an ML engineer who has never written a kernel (200 words), to a GPU architect (100 words).

**Done when:** each version is correct; each uses only terms its reader knows or defines them; the architect version contains no explanation the architect would find patronising.

### D18 · Causal chain
- skill: explanation
- minutes: 20
- weeks: 5
Write the mechanism behind one of your results as a numbered causal chain (A happens, so B, so C, so the measured effect). Mark each link as measured, derived, or assumed.

**Done when:** every link has a mark; you have decided which assumed link to measure or to flag in the text.

### D19 · Analogy audit
- skill: explanation
- minutes: 15
- weeks: 5
Write one analogy for a concept in your work (for example "a warp is like..."). Then list where the analogy breaks.

**Done when:** you have at least two failure points; you have decided whether the analogy helps the reader enough to keep, and where in the text to say where it breaks.

### D20 · Worklog paragraph
- skill: narrative
- minutes: 25
- weeks: 5, 7
Write the story of one optimisation step as: what you expected, what you measured, what surprised you, what you changed, what you measured after.

**Done when:** each stage has a number or a concrete observation; the surprise is stated as a surprise ("I expected X; it was Y").

---

## Week 6: math in prose

### D21 · Define, then use
- skill: math
- minutes: 20
- weeks: 6
Take one equation from your work. Write the paragraph that introduces it: say what it computes and why the reader needs it, define every symbol with its shape or units, then show the equation.

**Done when:** no symbol appears before its definition; every symbol has a type, shape or unit; the purpose comes before the formula.

### D22 · Equation as a sentence
- skill: math
- minutes: 15
- weeks: 6
Write three displayed equations as part of sentences, punctuated correctly, each followed by one sentence that says in words what the equation means and one that says what to notice.

**Done when:** read aloud, each passage is grammatical with the equation spoken; the "what to notice" names a property (sign, limit, scaling, special case).

### D23 · Signposted derivation
- skill: math
- minutes: 30
- weeks: 6
Derive one result you use (seed S9: the gradients of Hierarchical Sequential Transduction Unit (HSTU) attention; or the policy-gradient theorem; or Little's law applied to memory bandwidth). Before each step, say in words what the step does and why.

**Done when:** a reader can skip the algebra and still follow the argument from the signposts alone; every step is checkable.

### D24 · Sanity checks in prose
- skill: math
- minutes: 20
- weeks: 6
For one formula in your work, write three checks a reader can do: a units or dimension check, a limiting case, and a numeric example with your real numbers.

**Done when:** each check is worked through, not only named; at least one uses a value from your own logs.

---

## Week 7: code and systems narratives

### D25 · Code excerpt with purpose
- skill: code
- minutes: 20
- weeks: 7
Pick the five lines of code that carry the key idea of one of your kernels or scripts. Write the sentence before them (what to look for) and the sentence after (what it shows).

**Done when:** the excerpt is at most 15 lines; every line is needed for the point; the prose names the specific line or construct the reader should look at.

### D26 · Blameless timeline
- skill: narrative
- minutes: 25
- weeks: 7
Write the timeline of a debugging session or incident: timestamped (or step-numbered) observations, hypotheses and actions, ending in the root cause.

**Done when:** each entry is an observation, a hypothesis or an action, labelled as such; wrong hypotheses are included; no entry blames a person.

### D27 · Design decision record
- skill: decision
- minutes: 25
- weeks: 7, 8
Write a one-page design decision record for a choice you made (for example DLPack over numpy in the Triton backend, or private rows over shared atomics): context, options, decision, consequences.

**Done when:** at least two real alternatives are described fairly; consequences include a cost of the chosen option.

### D28 · Explain the failure, not the fix
- skill: explanation
- minutes: 20
- weeks: 7
Choose a bug you fixed. Write 200 words on *why* the bug happened (mechanism) before one sentence on the fix.

**Done when:** a reader could predict the bug from your explanation; the explanation would let them avoid similar bugs, not only this one.

---

## Week 8: the white paper

### D29 · Executive summary in 150 words
- skill: summary
- minutes: 20
- weeks: 8
Write a 150-word summary for a decision-maker: the decision, your recommendation, the two numbers that justify it, the main risk, and what happens next.

**Done when:** the recommendation is in the first two sentences; there is no jargon a manager would have to look up; a reader could act on it without reading further.

### D30 · Options and trade-offs
- skill: decision
- minutes: 25
- weeks: 8
Lay out three options for one decision in a table: cost, benefit, risk, time to value, and what would have to be true for each to be the best choice.

**Done when:** each option has a fair best case; your recommendation follows from the table, not from adjectives.

### D31 · Objections first
- skill: argument
- minutes: 20
- weeks: 8, 11
List the five strongest objections a skeptical reader will raise to your recommendation or claim. Answer each in two sentences, conceding where they are right.

**Done when:** at least one objection is partly conceded; each answer uses evidence, not reassurance.

### D32 · Numbers for a non-specialist
- skill: numbers
- minutes: 15
- weeks: 8
Translate five technical metrics into terms a budget-holder cares about (GPU-hours, dollars, latency users feel, time to train).

**Done when:** every translation shows its arithmetic and its assumptions; none overstates precision.

---

## Week 9: the paper, front matter

### D33 · Abstract in four moves
- skill: abstract
- minutes: 25
- weeks: 9, 12
Write a 150–200-word abstract in four moves: context and problem, the gap, what you did, what you found (with numbers) and why it matters.

**Done when:** each move is identifiable; the result sentence has numbers and a baseline; the abstract makes sense without the paper.

### D34 · Contribution list
- skill: claim
- minutes: 20
- weeks: 9
Write three to four contribution bullets. Each must be a verifiable statement that points to a section of the paper.

**Done when:** each bullet starts with a verb ("We show", "We design", "We release"); none is vague ("we study"); each could be checked by a reviewer.

### D35 · Related work as positioning
- skill: related-work
- minutes: 30
- weeks: 9
Group five to eight related works into two or three themes. For each theme write what it does, what it does not do, and how your work relates.

**Done when:** every paragraph ends with your work's relation to the theme; no paragraph is a list of summaries; you could defend every characterisation to that paper's authors.

### D36 · Introduction skeleton
- skill: structure
- minutes: 25
- weeks: 9
Write the introduction as five topic sentences only: the problem matters, current approaches fall short because, our insight is, we built or showed, our results are.

**Done when:** the five sentences alone make the argument; each is specific to your work, not to "the field".

---

## Week 10: the paper, method and evaluation

### D37 · Method from pseudocode
- skill: method
- minutes: 30
- weeks: 10
Write the method section for one algorithm or kernel of yours: a figure or pseudocode first, then the prose that walks through it, then the design choices and why.

**Done when:** an expert could reimplement it from the section alone; each design choice has a reason.

### D38 · Experimental setup paragraph
- skill: reproducibility
- minutes: 20
- weeks: 10
Write the setup: hardware, software versions, datasets and splits, baselines, metrics, number of runs, and how timing was measured.

**Done when:** a reviewer has no reproducibility question left; versions are exact; the timing method (warm-up, repetitions, median or mean) is stated.

### D39 · Research questions
- skill: evaluation
- minutes: 20
- weeks: 10
Write three to five research questions your evaluation answers, in the order a skeptical reader would ask them. Map each to one figure or table.

**Done when:** every result in your evaluation maps to a question; every question has a result.

### D40 · Threats to validity
- skill: evidence
- minutes: 20
- weeks: 10
Write the threats-to-validity paragraph: what could make your results wrong (internal), not generalise (external), or measure the wrong thing (construct), and what you did about each.

**Done when:** each threat is specific to your setup; each has a mitigation or an honest "not addressed".

---

## Week 11: review, revision, rebuttal

### D41 · Review a published paper
- skill: reviewing
- minutes: 30
- weeks: 11
Review a recent paper in your area as if you were on its program committee: summary, strengths, weaknesses, questions, and a recommendation.

**Done when:** the summary would satisfy the authors; each weakness is specific and actionable; you separate "wrong" from "I would have done it differently".

### D42 · Rebuttal paragraph
- skill: rebuttal
- minutes: 20
- weeks: 11
Take a critical comment (from a real reviewer, a colleague, or `prompts/reviewer.md` run on your draft). Write the response: thank, restate, answer with evidence, state the change you will make.

**Done when:** the response is under 150 words; it concedes what is right; it promises only changes you will make.

### D43 · Cut 20%
- skill: revision
- minutes: 25
- weeks: 11
Take a finished section and cut it by 20% without losing a claim or a number.

**Done when:** the word count dropped by at least 20%; the claim–evidence table for the section is unchanged.

### D44 · Read aloud
- skill: revision
- minutes: 15
- weeks: 11
Read one page of your draft aloud (or use text-to-speech). Mark every place you stumbled, ran out of breath, or lost the thread.

**Done when:** every mark has a fix; no sentence needed a second breath.

---

## Week 12: ship and re-form

### D45 · Title tournament
- skill: claim
- minutes: 15
- weeks: 12
Write twenty titles for your paper or post. Pick the best three by: does it state the claim, would the reader click, is it accurate.

**Done when:** at least five titles state a result rather than a topic; the winner is one you can defend in the abstract's first sentence.

### D46 · Re-form: paper to blog
- skill: re-forming
- minutes: 30
- weeks: 12
Rewrite your abstract and introduction as the opening of a blog post for practitioners.

**Done when:** the blog opening leads with the reader's problem, not the field's; it has no related-work positioning; it has a concrete example in the first 150 words.

### D47 · Submission checklist
- skill: publishing
- minutes: 20
- weeks: 12
Go through the target venue's call for papers and author guidelines. Write a checklist of every requirement (format, page limit, anonymity, artifact, ethics statement, deadlines) and mark your draft against it.

**Done when:** every requirement is checked or has a dated fix; employer approval is on the list if your work needs it.

### D48 · The talk version
- skill: re-forming
- minutes: 30
- weeks: 12
Turn your paper into an outline for a 10-minute talk: one claim per slide, at most eight slides, one figure per slide.

**Done when:** the slide titles alone tell the story; every figure is one from the paper or simpler.
