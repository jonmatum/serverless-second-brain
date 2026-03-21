variable "api_name" {
  description = "API Gateway REST API name"
  type        = string
}

variable "stage_name" {
  description = "Deployment stage name"
  type        = string
}

variable "capture_lambda_invoke_arn" {
  description = "Invoke ARN of the Capture Lambda"
  type        = string
}

variable "capture_lambda_function_name" {
  description = "Function name of the Capture Lambda (for permission)"
  type        = string
}

variable "cors_allow_origin" {
  description = "CORS allowed origin"
  type        = string
  default     = "*"
}

variable "throttle_burst" {
  description = "API-level burst throttle limit"
  type        = number
  default     = 100
}

variable "throttle_rate" {
  description = "API-level sustained throttle limit"
  type        = number
  default     = 50
}

variable "capture_throttle_burst" {
  description = "POST /capture burst throttle"
  type        = number
  default     = 10
}

variable "capture_throttle_rate" {
  description = "POST /capture sustained throttle"
  type        = number
  default     = 5
}

# ─── REST API ───

resource "aws_api_gateway_rest_api" "this" {
  name        = var.api_name
  description = "Serverless Second Brain API"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

# ─── /health (mock) ───

resource "aws_api_gateway_resource" "health" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_rest_api.this.root_resource_id
  path_part   = "health"
}

resource "aws_api_gateway_method" "health_get" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.health.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "health_mock" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.health.id
  http_method = aws_api_gateway_method.health_get.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = jsonencode({ statusCode = 200 })
  }
}

resource "aws_api_gateway_method_response" "health_200" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.health.id
  http_method = aws_api_gateway_method.health_get.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "health_200" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.health.id
  http_method = aws_api_gateway_method.health_get.http_method
  status_code = aws_api_gateway_method_response.health_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "'${var.cors_allow_origin}'"
  }

  response_templates = {
    "application/json" = jsonencode({
      status    = "healthy"
      version   = "1.0.0"
      timestamp = "$context.requestTime"
    })
  }
}

# ─── /capture (Lambda proxy) ───

resource "aws_api_gateway_resource" "capture" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_rest_api.this.root_resource_id
  path_part   = "capture"
}

resource "aws_api_gateway_method" "capture_post" {
  rest_api_id      = aws_api_gateway_rest_api.this.id
  resource_id      = aws_api_gateway_resource.capture.id
  http_method      = "POST"
  authorization    = "NONE"
  api_key_required = true
}

resource "aws_api_gateway_integration" "capture_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.capture.id
  http_method             = aws_api_gateway_method.capture_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.capture_lambda_invoke_arn
}

resource "aws_lambda_permission" "apigw_capture" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.capture_lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/*"
}

# ─── CORS (OPTIONS) for /capture ───

resource "aws_api_gateway_method" "capture_options" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.capture.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "capture_options" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.capture.id
  http_method = aws_api_gateway_method.capture_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = jsonencode({ statusCode = 200 })
  }
}

resource "aws_api_gateway_method_response" "capture_options_200" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.capture.id
  http_method = aws_api_gateway_method.capture_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "capture_options_200" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.capture.id
  http_method = aws_api_gateway_method.capture_options.http_method
  status_code = aws_api_gateway_method_response.capture_options_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'${var.cors_allow_origin}'"
  }
}

# ─── CORS (OPTIONS) for /health ───

resource "aws_api_gateway_method" "health_options" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.health.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "health_options" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.health.id
  http_method = aws_api_gateway_method.health_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = jsonencode({ statusCode = 200 })
  }
}

resource "aws_api_gateway_method_response" "health_options_200" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.health.id
  http_method = aws_api_gateway_method.health_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "health_options_200" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.health.id
  http_method = aws_api_gateway_method.health_options.http_method
  status_code = aws_api_gateway_method_response.health_options_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'${var.cors_allow_origin}'"
  }
}

# ─── Deployment + Stage ───

resource "aws_api_gateway_deployment" "this" {
  rest_api_id = aws_api_gateway_rest_api.this.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.health.id,
      aws_api_gateway_resource.capture.id,
      aws_api_gateway_method.health_get.id,
      aws_api_gateway_method.capture_post.id,
      aws_api_gateway_integration.health_mock.id,
      aws_api_gateway_integration.capture_lambda.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_integration.health_mock,
    aws_api_gateway_integration.capture_lambda,
    aws_api_gateway_integration.capture_options,
    aws_api_gateway_integration.health_options,
  ]
}

resource "aws_cloudwatch_log_group" "api_access" {
  name              = "/aws/apigateway/${var.api_name}"
  retention_in_days = 14
}

resource "aws_api_gateway_stage" "this" {
  deployment_id = aws_api_gateway_deployment.this.id
  rest_api_id   = aws_api_gateway_rest_api.this.id
  stage_name    = var.stage_name

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_access.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      caller         = "$context.identity.caller"
      user           = "$context.identity.user"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      resourcePath   = "$context.resourcePath"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
      latency        = "$context.integrationLatency"
    })
  }
}

resource "aws_api_gateway_method_settings" "all" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  stage_name  = aws_api_gateway_stage.this.stage_name
  method_path = "*/*"

  settings {
    throttling_burst_limit = var.throttle_burst
    throttling_rate_limit  = var.throttle_rate
    metrics_enabled        = true
    logging_level          = "INFO"
  }
}

resource "aws_api_gateway_method_settings" "capture" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  stage_name  = aws_api_gateway_stage.this.stage_name
  method_path = "capture/POST"

  settings {
    throttling_burst_limit = var.capture_throttle_burst
    throttling_rate_limit  = var.capture_throttle_rate
  }
}

# ─── API Key + Usage Plan ───

resource "aws_api_gateway_api_key" "this" {
  name    = "${var.api_name}-key"
  enabled = true
}

resource "aws_api_gateway_usage_plan" "this" {
  name = "${var.api_name}-usage-plan"

  api_stages {
    api_id = aws_api_gateway_rest_api.this.id
    stage  = aws_api_gateway_stage.this.stage_name
  }

  throttle_settings {
    burst_limit = var.throttle_burst
    rate_limit  = var.throttle_rate
  }
}

resource "aws_api_gateway_usage_plan_key" "this" {
  key_id        = aws_api_gateway_api_key.this.id
  key_type      = "API_KEY"
  usage_plan_id = aws_api_gateway_usage_plan.this.id
}

# ─── API Gateway account (CloudWatch role) ───

resource "aws_api_gateway_account" "this" {
  cloudwatch_role_arn = aws_iam_role.apigw_cloudwatch.arn
}

resource "aws_iam_role" "apigw_cloudwatch" {
  name = "${var.api_name}-apigw-cloudwatch"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "apigateway.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "apigw_cloudwatch" {
  role       = aws_iam_role.apigw_cloudwatch.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

# ─── Outputs ───

output "api_id" {
  value = aws_api_gateway_rest_api.this.id
}

output "api_execution_arn" {
  value = aws_api_gateway_rest_api.this.execution_arn
}

output "invoke_url" {
  value = aws_api_gateway_stage.this.invoke_url
}

output "api_key_id" {
  value = aws_api_gateway_api_key.this.id
}

output "api_key_value" {
  value     = aws_api_gateway_api_key.this.value
  sensitive = true
}

output "stage_name" {
  value = aws_api_gateway_stage.this.stage_name
}
