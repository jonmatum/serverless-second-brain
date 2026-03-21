# ADR-008: In-Memory Embedding Scan over Vector Database

**Status**: Accepted (temporary)
**Date**: 2026-03-21
**Context**: Issue #6, benchmark results (Benchmark 2), issue #20

## Decision

Scan all embedding vectors from DynamoDB into Lambda memory and compute cosine similarity in-process. No external vector database.

## Context

Semantic search requires comparing a query embedding against all stored embeddings. The standard approach is a vector database (OpenSearch, pgvector, Pinecone) with approximate nearest neighbor (ANN) indexing. But vector databases have minimum monthly costs that violate the project's idle cost constraint.

## Why this works at current scale

| Metric | Value |
|---|---|
| Nodes | 178 |
| EMBED items | 178 |
| Vector size | 1,024 floats × 4 bytes = 4KB per vector |
| Total embedding data | ~700KB |
| DynamoDB scan time | ~160ms |
| Cosine similarity (178 vectors) | ~3ms |
| Lambda memory cache TTL | 5 minutes |

The entire embedding corpus fits in Lambda memory with room to spare. Warm invocations skip the DynamoDB scan entirely.

## Scaling projections

From [Benchmark 1](../benchmarks/results.md):

| Nodes | Embedding data | Scan time | Practical? |
|---|---|---|---|
| 178 (current) | ~700KB | ~160ms | ✅ |
| 1,000 | ~4MB | ~900ms | ✅ |
| 5,000 | ~20MB | ~4.5s | ⚠️ Slow but within Lambda timeout |
| 10,000 | ~40MB | ~9s | ⚠️ Lambda memory pressure |
| 50,000 | ~200MB | ~45s | ❌ Exceeds Lambda timeout |

## Alternatives and their crossover points

From [Benchmark 2](../benchmarks/results.md):

| Scale | Best choice | Monthly idle cost |
|---|---|---|
| < 5,000 nodes | DynamoDB scan (current) | $0.00 |
| 5,000–50,000 | Aurora Serverless v2 + pgvector | ~$43 |
| > 50,000 | OpenSearch Serverless k-NN | ~$350 |

## Decision rationale

1. **$0 idle cost**: the project constraint is ~$0.51/month idle. Any vector database adds $43-350/month minimum.
2. **Sufficient performance**: 450ms total search latency at 178 nodes is well within acceptable range for a personal knowledge base.
3. **Simplicity**: no additional service to deploy, monitor, or pay for. The search Lambda is self-contained.
4. **Clear exit criteria**: the crossover point (~5K nodes) is well-defined. When the graph approaches that size, migrate to Aurora pgvector.

## Consequences

- Search latency degrades linearly with node count (O(n) scan)
- Lambda must have enough memory to hold all embeddings (~4KB per node)
- The 5-minute in-memory cache means new nodes aren't searchable for up to 5 minutes after creation
- No ANN indexing — every search computes exact cosine similarity against all vectors. This is actually an advantage at small scale (no index build time, no recall loss from approximation)

## Revisit trigger

Migrate to Aurora pgvector when ANY of:
- Graph exceeds 3,000 nodes (safety margin before the 5K crossover)
- Search latency exceeds 2 seconds (p95)
- The project adopts Aurora for another reason (making pgvector a free add-on)

Tracked in issue #20.

## References

- [Benchmark results](../benchmarks/results.md) — Benchmarks 1 and 2
- Issue #20 — Replace full graph scan with S3 snapshot
