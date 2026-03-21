# ADR-012: GitHub Actions OIDC over Static AWS Credentials

**Status**: Accepted
**Date**: 2026-03-21
**Context**: Issue #1, `.kiro/steering/terraform-conventions.md`, `infra/bootstrap/`

## Decision

Authenticate GitHub Actions to AWS using OpenID Connect (OIDC) federation instead of static IAM access keys.

## Context

The CI/CD pipeline runs `terraform plan`, `terraform apply`, and Lambda deployments. All require AWS credentials. The standard approach is an IAM user with access keys stored as GitHub Secrets. OIDC is the newer alternative.

## Options considered

### Option 1: IAM user with static access keys

- Create IAM user, generate access key pair, store in GitHub Secrets
- Simple to set up, widely documented
- Keys never expire unless manually rotated
- If leaked, attacker has persistent access until keys are revoked
- Requires manual rotation policy

### Option 2: GitHub Actions OIDC (chosen)

- GitHub Actions requests a short-lived OIDC token per workflow run
- AWS IAM role trusts the GitHub OIDC provider, scoped to the specific repo
- Credentials expire after the workflow completes (~1 hour max)
- No static secrets to rotate or leak
- Requires one-time OIDC provider registration in AWS IAM

### Option 3: AWS SSO / IAM Identity Center

- Centralized identity management
- Designed for human users, not CI/CD pipelines
- Adds complexity without benefit for a single-repo pipeline

## Decision rationale

1. **No static secrets**: OIDC tokens are ephemeral. There are no long-lived credentials to leak, rotate, or manage.
2. **Repo-scoped trust**: the IAM role trust policy restricts access to `repo:jonmatum/serverless-second-brain:*`. Even if the OIDC provider is shared across repos, only this repo can assume this role.
3. **Same pattern as jonmatum.com**: the knowledge base site already uses OIDC for its content agent workflows. Consistent approach across projects.
4. **Zero maintenance**: no key rotation schedule, no expiration alerts, no secret scanning concerns.

## Implementation

The OIDC provider and IAM role are defined in `infra/bootstrap/`:

- OIDC provider: `token.actions.githubusercontent.com` (registered once per AWS account)
- IAM role: `ssb-github-actions` with trust policy scoped to the repo
- Permissions: Terraform state access (S3 + DynamoDB), infrastructure management, Lambda deployment
- The only GitHub Secret is `AWS_ROLE_ARN` — the role ARN to assume (not a credential)

## Consequences

- First-time setup requires manual OIDC provider registration in AWS IAM (or Terraform in bootstrap)
- The `aws-actions/configure-aws-credentials` action handles the OIDC token exchange transparently
- If GitHub changes their OIDC thumbprint, the trust relationship breaks. This is rare but has happened once (2023). The fix is updating the thumbprint in the OIDC provider.
- Cannot be used outside GitHub Actions (local development uses `aws configure` with personal credentials)

## References

- [GitHub Actions OIDC](https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services) — GitHub, 2024
- [IAM OIDC identity providers](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html) — AWS, 2024
- `.kiro/steering/terraform-conventions.md` — CI/CD section
