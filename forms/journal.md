# Journal articles

**Reader:** an editor who chooses reviewers; two or three reviewers with more time than conference reviewers and higher expectations of completeness; later, researchers who want the definitive account of a piece of work.
**Decision they make:** accept, revise (major or minor), or reject, usually after one or more rounds of revision.
**Evidence bar:** complete. A journal article is expected to be the archival, self-contained account: full method, full experiments, full related work, limitations, and often proofs or extended analysis that a conference page limit excluded.
**Length:** usually longer than a conference paper (15–35 pages in many computing journals); check the journal's author guidelines.

## How journals differ from conferences

| | Conference | Journal |
|---|---|---|
| Review | One round, fixed deadline, short rebuttal | Several rounds, no fixed deadline, full revisions |
| Length | Strict page limit | Longer; completeness valued |
| Speed | Months | Months to more than a year |
| Response to reviewers | Rebuttal of one page or a word limit | Point-by-point response letter with every change |
| Typical content | New result | New result in full, or an extended version of a conference paper |

In computer science, many results first appear at a conference; an extended journal version must usually add substantial new material (journals often expect around 30% new content, but policies vary; read the journal's policy on prior publication). Some journals, such as the *Transactions on Machine Learning Research* (TMLR), review on a rolling basis with no deadlines and focus on correctness more than perceived significance.

## Structure

The structure follows the paper form (`forms/paper.md`), with more room:

- A longer introduction that places the work in the field.
- A full related-work section, often a survey in miniature.
- Complete methods, including details relegated to appendices in the conference version.
- Extended experiments: more workloads, more hardware, sensitivity analyses, failure cases.
- A discussion section: implications, limitations, threats to validity.

## The response letter

Revision rounds are where journal articles are won. The response letter (drill D42, `templates/review.md` for the reviewer side) follows a fixed pattern:

1. Thank the reviewers once, briefly, at the start.
2. Quote each comment in full, numbered (R1.1, R1.2, R2.1 ...).
3. Respond to each: agree and describe the change with its location ("Section 5.2, new Figure 7"), or disagree politely with evidence.
4. Quote or summarise the changed text, so the reviewer need not search for it.
5. Never ignore a comment. If you did not change something, say why.

A reviewer who sees every point addressed specifically is far more likely to recommend acceptance in the next round.

## Common failures

- **Submitting a conference paper unchanged** with "extended" in the title.
- **Defensive responses** that argue instead of improving the paper.
- **Changing the paper without saying where** in the response.
- **Choosing a journal by prestige alone**, rather than by whether its readers are the readers you want.
