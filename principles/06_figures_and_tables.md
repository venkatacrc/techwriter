# 6. Figures and tables

Many readers of a technical paper look at the figures before reading a sentence, and some read nothing else. Treat each figure as the argument in miniature.

## One message per figure

Before plotting, write the sentence the figure should prove: "Throughput grows almost linearly with batch size until 512 users, then flattens." Design the figure so that sentence is visible within two seconds. If a figure carries two messages, make two figures.

## Choose the encoding from the question

| Reader's question | Usually best |
|---|---|
| Which is bigger? (few items) | Bar chart starting at zero, or a dot plot |
| How does it change with X? | Line plot; log axes if X spans orders of magnitude |
| How does it scale? | Log–log plot; a slope tells the exponent |
| What is the distribution? (latency, reward across seeds) | Cumulative distribution (CDF), box or violin plot; never a mean alone |
| Where does the time go? | Stacked bar or a sorted horizontal bar of components |
| Is it compute- or memory-bound? | Roofline plot (performance vs arithmetic intensity) |
| Throughput versus latency trade-off | Throughput–latency curve, one point per load level |
| Exact values to look up | A table |

Tables are for lookup and for exact values; figures are for patterns and comparisons.

## Captions state the takeaway

A caption has three parts, in this order: the takeaway, what is plotted, and how to read it.

> **Figure 3.** Dynamic batching raises throughput 15× at 128 clients without raising tail latency. Requests per second (left) and p99 latency (right) against the number of concurrent clients, for the same model served with and without dynamic batching on one GPU. Medians of three 5-second runs; bars show the range.

The reader of the figure alone now knows what to conclude and how much to trust it.

## Make it readable

- **Label axes with quantity and unit**: "Step time (ms)", not "time".
- **Label lines directly** at their ends when possible, instead of a legend the eye must travel to.
- **Keep colours consistent** across all figures (your method is always the same colour), and choose colourblind-safe palettes (such as Okabe–Ito or ColorBrewer qualitative sets). Use colour for categories, not decoration.
- **Show variance**: error bars, bands or individual points; say in the caption what they are (standard deviation, 95% interval, min–max).
- **Do not truncate bar charts.** A bar's length is its value; a bar axis that starts at 90 exaggerates a 2% difference into a 2× visual one. Line plots may zoom if the axis range is labelled.
- **Avoid dual y-axes.** Two scales on one plot invite false correlations; use two panels.
- **Remove chart junk**: heavy gridlines, 3-D effects, shadows, backgrounds.
- **Size text** so it is readable at the printed size: axis labels as large as the caption text.

## Tables

- Units in the column header, not in every cell.
- Align numbers on the decimal point; use the same precision within a column.
- Use few horizontal rules and no vertical ones (in LaTeX, the `booktabs` package).
- Order rows by something meaningful (the baseline first, then by result), not by the order you ran them.
- If you bold the best result, say so in the caption, and bold it only when the difference exceeds the noise.

## Make figures reproducible

Generate every figure from logged data with a script kept in the repository, never by hand in a spreadsheet. When a reviewer asks "what happens at batch 4096?", you rerun one command. Name the figure file after the script that made it.

## Refer to figures with a claim

"See Figure 2" makes the reader find the message. "Figure 2 shows that the gap grows with sequence length" tells them what to look for. The text and the caption should state the same takeaway in different words.
