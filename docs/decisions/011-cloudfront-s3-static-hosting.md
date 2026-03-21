# ADR-011: CloudFront + S3 Static Export over Vercel/Amplify

**Status**: Accepted
**Date**: 2026-03-21
**Context**: Issue #10, `.kiro/steering/architecture.md`

## Decision

Serve the frontend as a static Next.js export via CloudFront + S3 with Origin Access Control (OAC), instead of using a managed hosting platform.

## Context

The jonmatum.com prototype runs on Vercel. The serverless second brain needs its own frontend for the knowledge graph visualization, search, and capture UI. The question: host on Vercel/Amplify (managed) or CloudFront + S3 (self-managed)?

## Options considered

### Option 1: Vercel

- Zero-config deployment for Next.js
- Free tier covers personal projects
- No control over CDN headers, edge functions, or cache policies
- Separate infrastructure from the AWS backend — two deployment pipelines
- Can't use the same Terraform workflow for frontend and backend

### Option 2: AWS Amplify Hosting

- AWS-managed, integrates with the existing AWS account
- Supports Next.js with SSR
- Minimum cost: ~$0.01/GB served + build minutes
- Less control than CloudFront over cache policies and security headers
- Adds another AWS service to learn and manage

### Option 3: CloudFront + S3 (chosen)

- Full control over cache policies, security headers, and edge behavior
- OAC (Origin Access Control) — S3 bucket is never publicly accessible
- Same Terraform workflow as the rest of the infrastructure
- Static export only — no SSR (acceptable for a SPA)
- Cost: ~$0.50/month (S3 storage + CloudFront free tier)

### Option 4: S3 website hosting (no CloudFront)

- Simplest option — S3 serves files directly
- No HTTPS on custom domains (S3 website endpoints are HTTP only)
- No security headers, no cache control, no edge caching
- Public bucket required

## Decision rationale

1. **Single infrastructure pipeline**: `terraform apply` deploys everything — DynamoDB, Lambda, API Gateway, and the frontend CDN. No separate Vercel/Amplify deployment.
2. **Security headers**: CloudFront response headers policy provides CSP, X-Frame-Options, HSTS, nosniff, and referrer policy. Vercel and Amplify offer some of these but with less granular control.
3. **OAC over public bucket**: the S3 bucket is never publicly accessible. CloudFront authenticates to S3 via OAC — a security improvement over S3 website hosting or older OAI.
4. **Domain-agnostic goal**: issue #13 aims to make the system deployable by others. CloudFront + S3 is configurable via `var.custom_domain` and `var.acm_certificate_arn` in Terraform. Vercel would require each deployer to have a Vercel account.
5. **Cost alignment**: CloudFront free tier (1TB/month transfer, 10M requests) covers a personal knowledge base. S3 storage is ~$0.023/GB. Total: ~$0.50/month, within the idle cost constraint.

## Consequences

- No SSR — the frontend must be a static export (Next.js `output: 'export'`). Dynamic routes use client-side data fetching from the API.
- SPA routing requires CloudFront custom error responses: 404 and 403 redirect to `/index.html` so client-side routing works.
- Cache invalidation on deploy: `lambda-deploy.yml` must run `aws cloudfront create-invalidation` after uploading new static files to S3.
- Custom domains require an ACM certificate in `us-east-1` (CloudFront requirement). The Terraform module accepts `var.acm_certificate_arn` as optional.

## References

- [CloudFront OAC](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html) — AWS, 2024
- `.kiro/steering/architecture.md` — Interface layer specification
