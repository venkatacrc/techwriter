# Seeds: facts from your own work

A seed is raw material for a piece: facts, numbers, sources, and the gaps in the evidence. It contains **no prose and no angle**. Finding the reader, the claim and the structure is the exercise. Seeds S1–S9 come from the GPU kernels course (`../gpukernels`); S10–S12 are for your own reinforcement learning (RL), training and math work.

All gpukernels numbers were measured on one NVIDIA GB200 (152 streaming multiprocessors, sm_100) with torch 2.12 and Triton 3.7, unless stated otherwise. Paths are relative to `../gpukernels/`.

**Before publishing any seed**, close its evidence gaps: rerun with stated run counts, record variance, record versions and the commit. Lesson text is not a source; the scripts and logs are.

Seeds are notes for you, so they use the course's abbreviations freely. Your pieces must define them for their readers.

<!-- twlint: off -->

---

## S1 · Shared-address atomics in the attention backward (week 5)

- Backward pass with one shared bias table: 33,285 µs. With private per-program rows, then one `sum(0)`: 474 µs.
- Position table 256 entries, time table 32: 288 addresses in total, targeted by every program's BM·BN atomic adds per tile.
- Same-address atomics serialise at the L2 slice that owns the line.
- Autotuner needs `reset_to_zero=["dpos_ptr", "dts_ptr"]`, or the accumulated gradients grow with each trial and the correctness check fails only on the first run.
- Sources: `course/07_hstu_attention_bwd.md`, `labs/07_hstu_attention_bwd/`.
- **Evidence gaps:** run count and spread for both timings; the batch shape used for the 33 ms number; a profiler counter that shows the serialisation (for example, atomic throughput or L2 stalls) rather than inferring it.

## S2 · Making the baseline fair (week 3)

- Dense PyTorch baseline is given pre-padded inputs (`padded_inputs`) so it is not charged for a Python padding loop; bf16 throughout.
- Realistic batches are 45–52% padding.
- Forward speedup: 10.4× (B=128, N≤200), 31.9× (B=64, N≤512, fused 121 µs), 12.9× (N≤2048). Peak memory at B=128, N≤200: 186 MB dense, 3 MB fused.
- Forward+backward speedup: 20.4×, 31.7×, 6.5× at the same three shapes. Fused forward+backward peak memory 48 MB vs 996 MB dense (B=64, N≤512).
- The reference's bias backward through advanced indexing took 1.26 s until it was replaced with `bincount` (`TableGather` in `gk/hstu_ref.py`): an unfair baseline that was fixed.
- Sources: `course/06_hstu_attention_fwd.md`, `course/07_hstu_attention_bwd.md`, `gk/hstu_ref.py`.
- **Evidence gaps:** run counts and spread; whether `torch.compile` or a FlashAttention-style dense baseline would narrow the gap; per-shape padding fractions.

## S3 · The autotune key that hung training (week 7)

- First training run hung for minutes per step.
- The GEMM autotuner was keyed on M; in a jagged batch M is the token count, which changes every step, so every step re-ran autotuning (compile and benchmark every config).
- Fix: key on `M_BUCKET = triton.next_power_of_2(M)`.
- Sources: `course/04_matmul_silu.md`, `course/09_training.md`, `labs/04_matmul_silu/`.
- **Evidence gaps:** time per step before and after; number of configs; the number of distinct M values per epoch and per bucket.

## S4 · Serving without Docker (week 7)

- Triton Inference Server run from the binaries in the `nvidia-pytriton` wheel, with a matching Python 3.13 built for the backend stub (`serving/setup_tritonserver.sh`, `logs/setup_tritonserver.log`).
- Every response failed with "output tensor shape does not match size of output". Copying arrays did not help; logging showed correct arrays. Cause: the stub is compiled against the numpy 1.x C ABI and misreads numpy 2 arrays. Fix: pass tensors via DLPack (`serving/hstu_backend.py`).
- Correctness: served top-10 equals offline top-10 for 50 of 50 users.
- Closed-loop load test, warm run: no batching 181 req/s (1 client), 270 req/s and p99 633 ms (128 clients); dynamic batching 3,940 req/s and p99 66 ms (128 clients), mean batch 48.4.
- A first measurement showed a cold p99 of 1.56 s because warm-up had happened in a different instance.
- Sources: `course/10_serving.md`, `logs/client_warm.log`, `logs/client.log`, `logs/tritonserver.log`.
- **Evidence gaps:** duration of each load level; repeats; the hypotheses you tried in order, with timestamps if you can reconstruct them.

## S5 · Where the training step's time goes (week 8)

- Profiled step: 278 kernel launches in about 10 ms of wall time, about 2.3 ms of summed GPU kernel time (about 22% busy). Launch-bound.
- Batch scaling: 0.40 M tokens/s at 32 users to 7.65 M tokens/s at 2,048 users (19×); step time flat (about 7.3–7.5 ms) from 32 to 512 users, 26.7 ms at 2,048.
- CUDA graphs for inference: eager top-10 for one user 2,617 µs, graph replay 174 µs; gain shrinks to 7.5× at 64 users; identical results.
- Start-up: cold 17.0 s; warm `TRITON_CACHE_DIR` 6.8 s; plus `TRITON_CACHE_AUTOTUNING=1` 2.7 s.
- Top remaining GPU kernels are fp32 `simt_sgemm` and softmax backward of the loss: fp32 logits run on CUDA cores, not tensor cores.
- Profiler and shared-GPU timings wobble by about ±30% between runs; the busy fraction is the stable signal.
- Sources: `course/11_system_opt.md`, `labs/11_system_opt/`, `logs/lab11.log`.
- **Evidence gaps:** cost per unit of work (GPU-hours per training run) for a white-paper reader; repeated runs; the effect of the bf16-logits fix, which has not been made yet.

## S6 · Jagged fused attention for sequential recommenders (weeks 9–10)

- Kernel: fused HSTU attention forward and backward on jagged batches (no padding, nothing N×N in HBM, causal block skipping). Speedups and memory as in S2; atomics as in S1.
- Model quality on MovieLens-1M, HR@10 / NDCG@10: baseline 0.2353 / 0.1183; full softmax over 3,706 items + position embedding 0.2651 / 0.1460; 4 layers + full softmax + position embedding 0.2820 / 0.1557. Paper SASRec 0.2853 / 0.1603; paper HSTU about 0.31.
- Training: 0.4 s per epoch with 2 layers.
- End-to-end serving as in S4.
- Sources: `course/06`–`10`, `logs/exp_*.log`, `logs/train_ml1m_triton.log`.
- **Evidence gaps:** single runs per configuration, so seeds and spread are needed before any quality claim; a related-work survey (FlashAttention, jagged kernels in torchrec/fbgemm, the HSTU paper's own kernels); a second dataset; a second GPU.

## S7 · A fused epilogue beats a faster GEMM (any week)

- Skinny GEMM 65,536×1,024×256, bf16. cuBLAS: 925 TFLOP/s, 37 µs, but GEMM + separate SiLU takes 95 µs (the SiLU reads and writes 128 MiB each way).
- Course step-2 kernel (TMA, persistent, warp-specialised): 763 TFLOP/s plain, but GEMM + fused SiLU in about 59 µs (1.6× faster than cuBLAS + SiLU).
- Sources: `course/04_matmul_silu.md`, `labs/04_matmul_silu/`.
- **Evidence gaps:** run counts; a cuBLASLt epilogue or `torch.compile` baseline, which can also fuse the activation.

## S8 · Little's law and bytes in flight (any week; good for an explainer)

- Vector add: Torch, Triton, Gluon and float4 CUDA reach about 7.1–7.2 TB/s; scalar CUDA about 4.1 TB/s; a plain copy 6.6 TB/s.
- Gluon vector-width sweep: 7,208 / 7,174 / 7,133 / 7,134 GB/s for widths 1 / 2 / 4 / 8, because each thread already has 32 independent loads in flight.
- Reduction: v2 2,362 GB/s (coalesced, one load in flight per thread), v3 5,823 GB/s (float4 and warp shuffles).
- Sources: `course/01_vector_add.md`, `course/05_cuda_reduction.md`.
- **Evidence gaps:** a measured memory latency for the GB200 (not "roughly 1 µs"); run counts.

## S9 · A derivation (week 6)

Choose one:

- **The HSTU attention gradients**: from \(A_{ij} = \frac{1}{N}\,\mathrm{SiLU}(\alpha\, q_i^\top k_j + b_{ij})\) for \(j \le i\) (zero otherwise) and \(O = AV\), to \(dQ, dK, dV\) and the bias gradients; why recomputation beats storing \(A\). Source: `course/07_hstu_attention_bwd.md`, `gk/hstu_ref.py`.
- **The policy-gradient theorem**: from \(J(\theta) = \mathbb{E}_{\tau \sim \pi_\theta}[R(\tau)]\) to \(\nabla_\theta J = \mathbb{E}\big[\sum_t \nabla_\theta \log \pi_\theta(a_t \mid s_t)\, G_t\big]\); why a baseline reduces variance without adding bias.
- **Little's law for memory**: bytes in flight = bandwidth × latency, and what it predicts for S8.

---

## S10 · Your reinforcement learning work

Fill in from your own experiments. Facts only.

- Environment(s), algorithm(s), and what changed between runs:
- Seeds per configuration, and the aggregate you report (mean, median, interquartile mean), with intervals:
- Compute (GPU-hours) per run:
- Logs:
- Evidence gaps:

## S11 · Your training work

- Model, data, scale, hardware:
- What you changed and what you measured (throughput, loss, quality), with baselines:
- Logs:
- Evidence gaps:

## S12 · A piece of math you use

- The result, where it is used in your work, and the derivation's source:
- A numerical check you can run:
- Evidence gaps:
