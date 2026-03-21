# ADR-010: Bedrock Token Optimization — Recent Slugs over Full List

**Status**: Accepted
**Date**: 2026-03-21
**Context**: Benchmark results (Benchmark 3), issue #19, commit `2b68b49`

## Decision

Pass only the 20 most recent node slugs (instead of all slugs) to the Bedrock classify prompt for cross-reference suggestions and duplicate avoidance.

## Context

Benchmark 3 revealed that the classify prompt consumed 6,764 input tokens per invocation. The primary cause: the prompt included all ~178 node slugs for duplicate detection and cross-reference suggestions. At $3/M input tokens (Claude Sonnet 4), this projected to $93.82/month at development-burst rate.

## The problem

```
Classify prompt tokens breakdown:
- System prompt + instructions:  ~800 tokens
- User's input text:             ~500 tokens
- All 178 slugs for context:     ~5,400 tokens  ← 80% of input
- Total:                         ~6,764 tokens
```

At 10,000 nodes, the slug list alone would be ~300K tokens per invocation — $0.90 per capture.

## Options considered

### Option 1: Keep all slugs (rejected)

- Guarantees no duplicate slugs and best cross-reference suggestions
- Cost scales linearly with graph size — unsustainable
- Most slugs are irrelevant to any given capture

### Option 2: Pass 20 recent slugs (chosen)

- Validate step checks for exact duplicate via DynamoDB `GetItem` (O(1), no LLM needed)
- Classify step receives 20 most recent slugs as cross-reference hints
- Reduces input tokens from ~6,764 to ~1,500 (78% reduction)
- Cross-reference quality may decrease slightly for older concepts

### Option 3: Bloom filter for duplicate detection

- Compact probabilistic data structure for membership testing
- Would eliminate slug list entirely from the prompt
- Adds complexity (generate and store Bloom filter, handle false positives)
- Overkill when DynamoDB `GetItem` already provides exact duplicate check

### Option 4: Embedding-based cross-reference suggestions

- Instead of passing slugs, pass the top-10 most similar nodes (by embedding cosine similarity)
- Better cross-reference quality than recent slugs
- Adds a Bedrock Titan call + DynamoDB scan before classification
- More complex, higher latency

## Decision rationale

1. **Duplicate detection doesn't need LLM**: the validate step already does a DynamoDB `GetItem` by slug. If the slug exists, it rejects the capture. No need to pass all slugs to Claude for this.
2. **Cross-reference hints are best-effort**: Claude suggests related concepts from the slug list, but the suggestions are reviewed by the human door (seed status). Missing a cross-reference is low-cost; paying $0.90 per capture is high-cost.
3. **81% cost reduction**: from $0.027 to ~$0.005 per capture. At development rate, from $93.82/month to ~$18/month.

## Impact

| Metric | Before | After |
|---|---|---|
| Input tokens per classify | 6,764 | ~1,500 |
| Cost per capture | $0.027 | ~$0.005 |
| Projected monthly (dev burst) | $93.82 | ~$18 |
| Cross-reference quality | Best (all slugs) | Good (20 recent) |
| Duplicate detection | LLM + DynamoDB | DynamoDB only (exact) |

## References

- [Benchmark results](../benchmarks/results.md) — Benchmark 3
- Commit `2b68b49` — Implementation
- Issue #19 — Tracking issue
