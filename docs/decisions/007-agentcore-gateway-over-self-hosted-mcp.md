# ADR-007: AgentCore Gateway over Self-Hosted MCP Server

**Status**: Accepted
**Date**: 2026-03-21
**Context**: Issue #8, `.kiro/steering/mcp-tools.md`, `.kiro/steering/architecture.md`

## Decision

Expose Lambda functions as MCP tools via AWS Bedrock AgentCore Gateway instead of running a self-hosted MCP server.

## Context

Phase 3 adds the "agent door" — an MCP-compatible interface that lets AI agents read, search, and write to the knowledge graph. The MCP specification defines a JSON-RPC protocol over HTTP/SSE for tool discovery and invocation. Something needs to translate between MCP protocol and Lambda invocations.

## Options considered

### Option 1: AgentCore Gateway (chosen)

- AWS-managed service that registers Lambda functions as MCP tools
- Handles MCP protocol translation, tool discovery, and invocation routing
- IAM auth built-in, OAuth configurable
- No server to run — scales to zero like the rest of the stack
- Cost: included in Bedrock pricing (no separate charge for Gateway)
- Requires AWS provider v6+ for Terraform support

### Option 2: Self-hosted MCP server in Lambda

- Python or Node.js MCP server running in a Lambda behind API Gateway
- Full control over tool definitions, middleware, and protocol handling
- Must implement MCP JSON-RPC protocol (tool discovery, invocation, streaming)
- Must handle SSE transport in Lambda (awkward — Lambda responses are not streamed natively)
- Additional Lambda to maintain and deploy

### Option 3: Self-hosted MCP server in ECS/Fargate

- Long-running container with native SSE support
- Full MCP protocol compliance including streaming
- Minimum cost: ~$10-15/month (Fargate spot, 0.25 vCPU, 0.5 GB)
- Violates idle cost constraint
- Operational overhead: container images, health checks, scaling policies

### Option 4: API Gateway WebSocket API

- WebSocket connections for bidirectional communication
- Could implement MCP-like protocol over WebSocket
- Not standard MCP — agents would need a custom client
- More complex than REST for simple tool invocations

## Decision rationale

1. **Zero idle cost**: AgentCore Gateway has no minimum charge. ECS/Fargate would add $10-15/month.
2. **Protocol compliance**: Gateway handles MCP protocol translation — tool discovery, JSON-RPC invocation, error formatting. A self-hosted server would need to implement this from scratch or use an MCP SDK.
3. **Lambda reuse**: the same Lambda functions serve both the human door (API Gateway REST) and the agent door (AgentCore Gateway). No code duplication.
4. **Managed auth**: Gateway supports IAM auth natively and OAuth via configuration. A self-hosted server would need custom auth middleware.
5. **Operational simplicity**: no container images, no health checks, no scaling configuration. Aligns with the project's "deploy with `terraform apply`" goal.

## Consequences

- Vendor lock-in to AWS AgentCore. If AgentCore is deprecated or pricing changes, the fallback is a self-hosted MCP server in Lambda (Option 2).
- AgentCore Gateway requires AWS provider v6+ in Terraform. This forced an upgrade from v5 during Phase 3 implementation.
- Tool definitions are in Terraform (HCL), not in code. Changes to tool schemas require `terraform apply`, not just a Lambda deploy.
- AgentCore Gateway uses IAM auth by default. External (non-AWS) agents need OAuth configuration (tracked in issue #17).
- SSE streaming is handled by Gateway. Lambda functions return synchronous responses — Gateway translates to the appropriate MCP transport.

## What this does NOT cover

- **AgentCore Runtime** (the reasoning agent that uses the tools) is a separate concern. Gateway exposes tools; Runtime hosts the agent that calls them. Runtime is tracked in issue #18.
- **OAuth for external agents** is tracked in issue #17 (ADR-003).

## References

- [Bedrock AgentCore](https://aws.amazon.com/bedrock/agentcore/) — AWS, 2025
- [AgentCore Gateway Developer Guide](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway.html) — AWS, 2025
- [MCP Specification](https://modelcontextprotocol.io/specification/latest) — Anthropic, 2025
- `.kiro/steering/mcp-tools.md` — Tool definitions and write safety rules
