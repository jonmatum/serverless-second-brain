variable "topic_name" {
  description = "SNS topic name"
  type        = string
}

variable "email_subscriptions" {
  description = "Email addresses to subscribe to the topic"
  type        = list(string)
  default     = []
}

resource "aws_sns_topic" "this" {
  name = var.topic_name
}

resource "aws_sns_topic_subscription" "email" {
  count     = length(var.email_subscriptions)
  topic_arn = aws_sns_topic.this.arn
  protocol  = "email"
  endpoint  = var.email_subscriptions[count.index]
}

output "topic_arn" {
  value = aws_sns_topic.this.arn
}

output "topic_name" {
  value = aws_sns_topic.this.name
}
