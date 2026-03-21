# ADR-004: DynamoDB Single-Table Design

**Status**: Accepted
**Date**: 2026-03-21
**Context**: Issue #2, `.kiro/steering/dynamodb-schema.md`, benchmark results

## Decision

Use a single DynamoDB table with composite keys (`PK`/`SK`) and two GSIs to store all data: node metadata, edges, embeddings, and audit trail.

## Context

The knowledge graph needs to support multiple access patterns: read a node, traverse edges bidirectionally, search by status, and audit mutations. The data model has four item types (META, EDGE, EMBED, AUDIT) with different shapes but shared access patterns.

## Options considered

### Option 1: Single-table design (chosen)

All item types in one table, differentiated by `PK`/`SK` patterns:

| PK | SK | Item type |
|---|---|---|
| `NODE#{slug}` | `META` | Node metadata |
| `NODE#{slug}` | `EDGE#{target}` | Outbound edge |
| `NODE#{slug}` | `EMBED` | 1,024-dim vector |
| `AUDIT#{timestamp}` | `NODE#{slug}` | Mutation audit |

GSI1 (inverted: SK → PK) enables reverse edge queries. GSI2 (`STATUS#{status}` → `updated_at`) enables status-based filtering.

### Option 2: Multi-table (one per item type)

- `nodes` table, `edges` table, `embeddings` table, `audit` table
- Simpler per-table schema, familiar relational mental model
- Requires cross-table joins in application code
- 4× the Terraform resources, 4× the IAM policies
- No transactional writes across tables without `TransactWriteItems`

### Option 3: Amazon Neptune (graph database)

- Native graph queries (Gremlin/openCypher), no GSI workarounds
- Minimum cost: ~$115/month (db.t3.medium on-demand)
- Violates the $1/month idle cost constraint
- Overkill for ~200 nodes with simple `related` edges

### Option 4: Aurora Serverless v2 with pgvector

- SQL + vector search in one service
- Minimum cost: ~$43/month (0.5 ACU)
- Violates the idle cost constraint
- Would solve the embedding scan problem at scale (see ADR-008)

## Decision rationale

1. **Cost**: PAY_PER_REQUEST DynamoDB costs $0.00 at idle. Neptune and Aurora have minimum monthly costs that exceed the project's $1/month idle constraint.
2. **Access pattern fit**: the four item types share the same partition key (`NODE#{slug}`), making single-table natural. A `Query` on `PK = NODE#serverless` returns metadata, edges, and embedding in one call.
3. **Bidirectional edges**: GSI1 (inverted index) solves "what points to X?" without duplicating edge data. Multi-table would require a separate reverse-edge table or application-level fan-out.
4. **Operational simplicity**: one table, one backup policy, one set of alarms. The essay targets builders who can deploy with `terraform apply` — fewer resources means fewer things to configure.

## Consequences

- All DynamoDB code must understand the `PK`/`SK` key patterns — no ORM, manual marshalling
- Full table scans (used by `GET /graph` and search) read all item types, not just the ones needed. At 178 nodes this is 1,212 items (~290ms). Benchmark #1 projects this becomes impractical at ~5,000 nodes (see issue #20)
- Embedding vectors (8KB per node) inflate scan size. At 10K nodes, EMBED items alone would be ~80MB
- TTL on AUDIT items (90 days) keeps the table from growing unbounded
- The schema is documented in `.kiro/steering/dynamodb-schema.md` as the single source of truth

## Revisit criteria

- If the graph exceeds 5,000 nodes, evaluate the S3 snapshot approach (issue #20) or paginated API before considering a database change
- If edge traversal queries become complex (multi-hop, weighted shortest path), Neptune becomes worth the cost premium
- If vector search latency exceeds 2 seconds, evaluate Aurora pgvector (benchmark #2 crossover at ~5K nodes)

## References

- [DynamoDB single-table design](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-general-nosql-design.html) — AWS, 2024
- [Benchmark results](../benchmarks/results.md) — Benchmarks 1 and 2
- `.kiro/steering/dynamodb-schema.md` — Schema specification
