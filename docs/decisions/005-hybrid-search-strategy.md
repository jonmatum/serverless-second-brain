# ADR-005: Hybrid Search — Keyword + Semantic with In-Memory Cosine Similarity

**Status**: Accepted
**Date**: 2026-03-21
**Context**: Issue #6, benchmark results (Benchmark 2), `.kiro/steering/architecture.md`

## Decision

Combine keyword matching (DynamoDB) and semantic search (Bedrock Titan embeddings + in-memory cosine similarity) with configurable weights: 0.3 keyword, 0.7 semantic.

## Context

The jonmatum.com prototype attempted browser-side semantic search using Transformers.js WASM. It failed in production due to a 30MB model download, WASM inconsistencies across browsers, and Vercel deployment issues (jonmatum.com issue #9). Moving search to the server was a primary motivation for the serverless backend.

## Options considered

### Option 1: Pure keyword search (DynamoDB only)

- Match query terms against title, summaries, tags using DynamoDB `contains` filters
- No ML dependency, no Bedrock cost
- Misses semantic relationships: searching "cloud functions" wouldn't find "AWS Lambda"
- The prototype already had keyword search — this would be a regression

### Option 2: Pure semantic search (Bedrock Titan only)

- Embed query → cosine similarity against stored vectors → rank by score
- Captures meaning, not just keywords
- Fails on exact matches: searching "AWS Lambda" might rank a general serverless article higher than the Lambda-specific one
- Bedrock embedding cost per query: ~$0.000014 (negligible)

### Option 3: Hybrid search (chosen)

- Keyword score (0.3 weight): exact and partial matches against title, summaries, tags
- Semantic score (0.7 weight): cosine similarity between query embedding and stored embeddings
- Combined score = (keyword × 0.3) + (semantic × 0.7)
- Best of both: exact matches surface for precise queries, semantic matches surface for conceptual queries

### Option 4: OpenSearch Serverless with k-NN

- Purpose-built vector search with O(log n) k-NN
- Minimum cost: ~$350/month (2 OCUs)
- Violates idle cost constraint by 700×

### Option 5: Aurora Serverless v2 with pgvector

- SQL + vector search, IVFFlat index for O(log n)
- Minimum cost: ~$43/month
- Still 86× over idle cost constraint

## Decision rationale

1. **Hybrid covers both use cases**: exact queries ("AWS Lambda") get keyword boost, conceptual queries ("serverless compute") get semantic boost. Neither pure approach handles both well.
2. **Cost**: Bedrock Titan embedding is $0.000014 per query. DynamoDB scan is covered by existing PAY_PER_REQUEST. Total added cost per search: ~$0.00002. OpenSearch and Aurora have minimum monthly costs that violate the project constraint.
3. **Simplicity**: the entire search runs in a single Lambda invocation — embed query, scan DynamoDB, compute similarity, merge scores, return. No external search service to manage.
4. **The 0.7 semantic weight** was chosen because the knowledge base has rich cross-domain content where meaning matters more than exact terms. The weight is hardcoded but trivially configurable.

## Consequences

- Every search query invokes Bedrock Titan (~87ms latency). This is the floor for search latency.
- The DynamoDB scan reads all EMBED items into Lambda memory (see ADR-008 for scaling analysis). At 178 nodes this is ~700KB and takes ~160ms. At 10K nodes it would be ~40MB — still fits in Lambda memory but scan time becomes the bottleneck.
- Lambda caches embeddings in memory across warm invocations (5-minute TTL). Warm searches skip the DynamoDB scan.
- The keyword scorer is simple (term matching against fields). It doesn't support stemming, fuzzy matching, or language-specific tokenization. This is acceptable for a personal knowledge base with controlled vocabulary.

## Benchmark data

From [Benchmark 2](../benchmarks/results.md):

| Approach | Latency (178 nodes) | Cost at rest | Cost per query |
|---|---|---|---|
| DynamoDB hybrid (current) | 450ms | $0.00 | ~$0.00002 |
| OpenSearch k-NN | ~100-200ms est. | $350/mo | ~$0.00002 |
| Aurora pgvector | ~50-150ms est. | $43/mo | ~$0.00002 |

Crossover points: DynamoDB → Aurora at ~5K nodes, Aurora → OpenSearch at ~50K nodes.

## Revisit criteria

- Search latency exceeds 2 seconds (projected at ~5K nodes)
- Users report poor search quality due to keyword scorer limitations
- The project adopts a minimum-cost service (Aurora/OpenSearch) for other reasons, making vector search a free add-on

## References

- [Bedrock Titan Text Embeddings](https://docs.aws.amazon.com/bedrock/latest/userguide/titan-text-embeddings.html) — AWS, 2024
- [jonmatum.com issue #9](https://github.com/jonmatum/jonmatum.com/issues/9) — Semantic search removal from prototype
- [Benchmark results](../benchmarks/results.md) — Benchmark 2
