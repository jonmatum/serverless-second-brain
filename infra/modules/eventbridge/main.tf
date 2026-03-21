variable "rule_name" {
  description = "EventBridge rule name"
  type        = string
}

variable "schedule_expression" {
  description = "Schedule expression (e.g., cron(0 8 * * ? *))"
  type        = string
}

variable "lambda_arn" {
  description = "Target Lambda function ARN"
  type        = string
}

variable "lambda_function_name" {
  description = "Target Lambda function name (for permission)"
  type        = string
}

variable "input_json" {
  description = "JSON input to pass to the Lambda"
  type        = string
  default     = ""
}

variable "retry_attempts" {
  description = "Number of retry attempts"
  type        = number
  default     = 2
}

# --- Rule ---

resource "aws_cloudwatch_event_rule" "this" {
  name                = var.rule_name
  schedule_expression = var.schedule_expression
  state               = "ENABLED"
}

resource "aws_cloudwatch_event_target" "this" {
  rule      = aws_cloudwatch_event_rule.this.name
  target_id = "lambda"
  arn       = var.lambda_arn

  input = var.input_json != "" ? var.input_json : jsonencode({
    source        = "secondbrain.scheduler"
    "detail-type" = "DailySurfacing"
    detail = {
      run_id       = "scheduled"
      triggered_at = "auto"
    }
  })

  retry_policy {
    maximum_retry_attempts       = var.retry_attempts
    maximum_event_age_in_seconds = 600
  }
}

resource "aws_lambda_permission" "eventbridge" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.this.arn
}

# --- Outputs ---

output "rule_arn" {
  value = aws_cloudwatch_event_rule.this.arn
}

output "rule_name" {
  value = aws_cloudwatch_event_rule.this.name
}
