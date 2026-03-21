output "environment" {
  value = var.environment
}

output "project_name" {
  value = var.project_name
}

# Memory layer
output "dynamodb_table_name" {
  value = module.dynamodb.table_name
}

output "dynamodb_table_arn" {
  value = module.dynamodb.table_arn
}

output "s3_content_bucket_name" {
  value = module.s3_content.bucket_name
}

output "s3_content_bucket_arn" {
  value = module.s3_content.bucket_arn
}

# IAM
output "dynamodb_read_policy_arn" {
  value = module.iam.dynamodb_read_policy_arn
}

output "dynamodb_write_policy_arn" {
  value = module.iam.dynamodb_write_policy_arn
}

output "s3_read_policy_arn" {
  value = module.iam.s3_read_policy_arn
}

output "s3_write_policy_arn" {
  value = module.iam.s3_write_policy_arn
}

output "bedrock_invoke_policy_arn" {
  value = module.iam.bedrock_invoke_policy_arn
}

# Compute layer
output "capture_function_name" {
  value = module.capture_lambda.function_name
}

output "capture_function_arn" {
  value = module.capture_lambda.function_arn
}

output "capture_invoke_arn" {
  value = module.capture_lambda.invoke_arn
}

# Interface layer
output "api_gateway_invoke_url" {
  value = module.api_gateway.invoke_url
}

output "api_gateway_id" {
  value = module.api_gateway.api_id
}

output "api_gateway_execution_arn" {
  value = module.api_gateway.api_execution_arn
}

output "api_key_id" {
  value = module.api_gateway.api_key_id
}

output "api_key_value" {
  value     = module.api_gateway.api_key_value
  sensitive = true
}
