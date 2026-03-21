variable "name" {
  description = "State machine name"
  type        = string
}

variable "type" {
  description = "Workflow type: STANDARD or EXPRESS"
  type        = string
  default     = "EXPRESS"

  validation {
    condition     = contains(["STANDARD", "EXPRESS"], var.type)
    error_message = "Type must be STANDARD or EXPRESS."
  }
}

variable "definition" {
  description = "ASL state machine definition (JSON string)"
  type        = string
}

variable "lambda_arns" {
  description = "Lambda ARNs the state machine can invoke"
  type        = list(string)
  default     = []
}

variable "sns_topic_arns" {
  description = "SNS topic ARNs the state machine can publish to"
  type        = list(string)
  default     = []
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 14
}

# IAM role
resource "aws_iam_role" "this" {
  name = "${var.name}-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "states.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "invoke_lambda" {
  count = length(var.lambda_arns) > 0 ? 1 : 0
  name  = "${var.name}-invoke-lambda"
  role  = aws_iam_role.this.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "lambda:InvokeFunction"
      Resource = var.lambda_arns
    }]
  })
}

resource "aws_iam_role_policy" "publish_sns" {
  count = length(var.sns_topic_arns) > 0 ? 1 : 0
  name  = "${var.name}-publish-sns"
  role  = aws_iam_role.this.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "sns:Publish"
      Resource = var.sns_topic_arns
    }]
  })
}

resource "aws_iam_role_policy" "logs" {
  name = "${var.name}-logs"
  role = aws_iam_role.this.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogDelivery",
        "logs:GetLogDelivery",
        "logs:UpdateLogDelivery",
        "logs:DeleteLogDelivery",
        "logs:ListLogDeliveries",
        "logs:PutResourcePolicy",
        "logs:DescribeResourcePolicies",
        "logs:DescribeLogGroups"
      ]
      Resource = "*"
    }]
  })
}

# CloudWatch log group
resource "aws_cloudwatch_log_group" "this" {
  name              = "/aws/states/${var.name}"
  retention_in_days = var.log_retention_days
}

# State machine
resource "aws_sfn_state_machine" "this" {
  name     = var.name
  role_arn = aws_iam_role.this.arn
  type     = var.type

  definition = var.definition

  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.this.arn}:*"
    include_execution_data = true
    level                  = "ALL"
  }
}

output "state_machine_arn" {
  value = aws_sfn_state_machine.this.arn
}

output "state_machine_name" {
  value = aws_sfn_state_machine.this.name
}

output "role_arn" {
  value = aws_iam_role.this.arn
}
