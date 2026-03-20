---
inclusion: always
---

# Architecture — Serverless Second Brain

This file is the source of truth for the system architecture. Every implementation decision must align with this spec. Derived from the essay "From Prototype to Production: A Serverless Second Brain on AWS."

## Three-layer principle

The system separates into three layers. Each layer can evolve independently.

```
Interface → Compute → Memory
```

- **Interface**: how humans and agents access the system
- **Compute**: what the system does with requests
- **Memory**: where data lives

No layer may bypass another. Interface never talks directly to Memory.

## Services per layer

### Memory layer

| Service | Role | Key constraint |
|---|---|---|
| DynamoDB | Metadata, edges, embeddings, audit trail | Single-table design, PAY_PER_REQUEST |
| S3 (content) | Long-form MDX body (ES + EN) | Versioning enabled, SSE-S3 |

### Compute layer

| Service | Role | Key constraint |
|---|---|---|
| Lambda Capture | Ingest text → classify → persist | 512 MB, 30s timeout, Node.js 22.x |
| Lambda Search | Hybrid keyword + semantic search | Reads DynamoDB + Bedrock Titan |
| Lambda Graph | Build and serve knowledge graph JSON | Reads DynamoDB, caches in memory |
| Lambda Surfacing | Daily analysis of graph health | Triggered by EventBridge, writes to SNS |
| Step Functions | Orchestrate multi-step capture pipeline | Express Workflow for sync, Standard for async |
| EventBridge | Schedule daily surfacing cron | `cron(0 8 * * ? *)` |
| Bedrock Claude | Classification, metadata generation, agent reasoning | `us.anthropic.claude-sonnet-4-20250514-v1:0` |
| Bedrock Titan | Embeddings (1,024 dimensions) | `amazon.titan-embed-text-v2:0` |
| AgentCore Runtime | Host reasoning agent in microVMs | Session isolation, tool access via Gateway |

### Interface layer

| Service | Role | Key constraint |
|---|---|---|
| API Gateway REST | Human door — SPA and external clients | Throttling, API keys for writes, CORS |
| AgentCore Gateway | Agent door — MCP tools | OAuth, semantic discovery, protocol translation |
| CloudFront + S3 | Static frontend (Next.js export) | OAC, security headers, cache policies |

## Two doors

- **Human door**: CloudFront → SPA + API Gateway REST (search, graph, capture)
- **Agent door**: AgentCore Gateway → MCP tools (read_node, add_node, connect_nodes, search, flag_stale, list_nodes)

Both doors use the same Lambda functions. The difference is protocol and auth.

## Cost constraint

The system MUST scale to zero. No minimum costs beyond S3 storage (~$0.50/mo).

| Load | Target cost |
|---|---|
| Idle (0 req/day) | ~$0.51/mo |
| Moderate (100 req/day) | ~$2.44/mo |
| High (1,000 req/day) | ~$11.21/mo |

If a design decision increases idle cost above $1/mo, it requires an ADR in `docs/decisions/`.

## Phased delivery

Each phase is independently deployable and adds value without requiring subsequent phases.

- **Phase 1**: Capture API (Lambda + API Gateway + DynamoDB + S3 + Step Functions)
- **Phase 2**: Search + Graph + Frontend (Search Lambda + Graph Lambda + CloudFront)
- **Phase 3**: Agent door (AgentCore Gateway + Runtime + MCP tools)
- **Phase 4**: Proactive surfacing (EventBridge + Surfacing Lambda + SNS)
