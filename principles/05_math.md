# 5. Mathematics in prose

The innovations you want to write about (attention variants, optimisers, quantisation, policy gradients, scaling laws, roofline models) are explained with mathematics. Mathematical writing is prose that contains symbols, and the same rules apply: reader first, purpose first, one idea at a time. The classic guides are Paul Halmos, *How to Write Mathematics* (1970); Donald Knuth, Tracy Larrabee and Paul Roberts, *Mathematical Writing* (Stanford lecture notes, 1989); and, for proofs, Leslie Lamport, *How to Write a 21st Century Proof* (2012).

## Say what the equation is for before you show it

A reader meeting an equation asks: why am I looking at this? Answer first.

- Before: "Let \(G_t = \sum_{k=0}^{\infty} \gamma^k r_{t+k+1}\)."
- After: "The agent should prefer actions that lead to high reward later, not only now. We measure *later* with the discounted return, the sum of future rewards, each shrunk by a factor \(\gamma \in [0, 1)\) per step of delay: \(G_t = \sum_{k=0}^{\infty} \gamma^k r_{t+k+1}\)."

## Define every symbol, before or immediately after its first use

For each symbol give what it is, and its type, shape or unit: "\(Q \in \mathbb{R}^{N \times d}\), the queries for a sequence of \(N\) tokens with head dimension \(d\)". For a paper with more than about ten symbols, add a notation table. Never redefine a symbol, and never use one symbol for two things (\(N\) as sequence length and as batch size in the same paper is a real and common error).

## Keep notation consistent and conventional

- Follow your field's conventions: lowercase bold or plain lowercase for vectors, uppercase for matrices, \(\theta\) for parameters, \(\pi\) for policies, \(\mathbb{E}\) for expectation.
- Write multi-letter names upright: \(\mathrm{softmax}\), \(\mathrm{SiLU}\), \(\operatorname{clip}\). Italic *softmax* reads as a product of seven variables.
- Match code and math when you show both: if the code says `head_dim`, the text says \(d\) and states once that \(d\) is `head_dim`.

## Equations are parts of sentences

An equation is read aloud as words, so it takes the punctuation those words would need.

> The proximal policy optimisation (PPO) objective clips the probability ratio
> \[ L(\theta) = \mathbb{E}_t\big[\min\big(\rho_t A_t,\ \operatorname{clip}(\rho_t, 1-\epsilon, 1+\epsilon) A_t\big)\big], \]
> where \(\rho_t\) is the ratio of the new to the old policy's probability of the action taken and \(A_t\) is the advantage estimate.

Note the comma after the display and the "where" clause that continues the sentence. Do not start a sentence with a symbol ("\(x\) is ..." becomes "The input \(x\) is ...").

## Words, equation, words

After a displayed equation, say in words what it means and what to notice: a sign, a limit, a scaling, a special case. For the clipped objective: "When the advantage is positive, the objective stops increasing once the ratio exceeds \(1+\epsilon\), so one update cannot move the policy far from the one that collected the data." This sentence is where understanding happens; the equation is only where precision happens.

## Derivations: signpost every step

A derivation is an argument, not a wall of algebra. Before each step, state what it does ("expand the square", "the cross term vanishes because the noise has zero mean", "apply the chain rule through the SiLU"). A reader should be able to follow the derivation by reading the signposts alone. Move routine algebra to an appendix and keep the steps where something happens in the main text.

## Check your math in the text

Show the reader the checks that build trust (drill D24):

- **Units or dimensions.** If bandwidth is bytes per second and latency is seconds, bytes in flight is their product, in bytes.
- **Limiting cases.** With \(\gamma = 0\) the return is the immediate reward; with \(\epsilon \to \infty\) PPO's objective becomes the unclipped policy gradient.
- **A number.** Plug in a real value from your own experiment and show that the formula predicts what you measured.

## Statements and quantifiers

A theorem or claim states all its assumptions ("for a differentiable policy with bounded rewards"). Use "for all", "there exists", "almost surely" deliberately. "Converges" needs a sense (in expectation? with probability one?) and a rate if you have one.

## Mechanics

- In blogs, render math with KaTeX or MathJax and check it on mobile.
- In papers, number only the equations you refer to; refer to them as "Equation (3)" or "Eq. 3", consistently.
- In LaTeX, use `\left( \right)` sparingly, `\cdot` for multiplication when needed, and `\text{}` or `\mathrm{}` for words inside math.
