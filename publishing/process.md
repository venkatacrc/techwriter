# From draft to published

## Before you write: permissions

If the work was done for an employer, find out before drafting:

- **Who approves external publication**, and how long approval takes (often weeks). Many companies require legal, IP (intellectual property) and security review of anything public, including blogs.
- **Whether a patent filing must come first.** Public disclosure can destroy patent rights in many jurisdictions.
- **What you may disclose**: model sizes, hardware counts, customer data, internal names, numbers that reveal capacity or cost.
- **Whether your name, your team's or the company's goes on it**, and which affiliation to list.

Side projects on your own time and hardware (such as the GPU kernels course) usually avoid most of this, but check your employment agreement.

## Blog posts

1. Draft, cool off, self-review (`tw review`), outside review (a colleague and `prompts/reviewer.md`).
2. Check every number against its log, every command by running it, every link by clicking it.
3. Get approval if required.
4. Publish on a site you control; cross-post with a canonical link if you want reach.
5. Share where your readers are, with the claim in the post text, not "new blog post!".

## Preprints (arXiv)

- arXiv accepts preprints in computer science after a light moderation check. First-time submitters in a category may need an endorsement from an existing author.
- Most ML venues allow arXiv preprints of submitted work; some venues restrict publicising a paper during anonymous review. Check the venue's anonymity policy before posting or promoting.
- Choose the licence deliberately; it cannot be made more restrictive later.
- Post a new version when the paper changes materially, and keep the version history clean.

## Conference submission

1. **Read the call for papers** completely: page limit, template, anonymity rules, supplementary material, artifact policy, AI-use policy, conflicts of interest.
2. **Use the official template from the start**; never fight formatting the night before.
3. **Anonymise** if the venue is double-blind: no names, no identifying URLs, cite your own prior work in the third person.
4. **Submit an abstract** if the venue requires one before the paper deadline.
5. **Rebuttal**: you may get a short window to answer reviews. Answer the comments that could change a decision first; be brief, specific and courteous; offer new results only if you have them (drill D42).
6. **Camera-ready**: address the reviewers' requests, de-anonymise, and meet the final formatting checks.
7. **Artifact evaluation** (optional at many systems venues): package code, data and scripts so a committee can reproduce the main results; badges signal reproducibility to readers.

## Journal submission

1. Read the author guidelines and the policy on prior publication (an extended conference paper usually needs substantial new material).
2. Write a **cover letter**: what the paper contributes, why it fits the journal, and how it differs from any prior version.
3. Suggest reviewers if invited, and declare conflicts.
4. Expect one or more rounds of **revision**: major revision, minor revision, then acceptance (or rejection at any stage).
5. For each round, write a **response letter** (see `forms/journal.md`): every comment quoted, answered, and located in the revised text.

## Rejection

Most papers are rejected at least once; acceptance rates at top venues are often around 20–25%. Treat a rejection as a free, expert review. Within a week:

1. Read the reviews once, then wait a day.
2. Sort the comments: misunderstandings (fix the writing), missing evidence (run the experiment), disagreements about significance (reframe, or choose a different venue).
3. Revise before resubmitting. Reviewers at the next venue may include the same people.

## AI tools and disclosure

Policies on the use of AI writing tools differ across publishers and venues and are changing. Common patterns: language models cannot be listed as authors; substantive use of AI-generated text must be disclosed; reviewers must not upload submissions they review to AI tools. Read the current policy of the specific venue. This program uses AI only as a critic (`prompts/reviewer.md`), so your text remains your own writing.
