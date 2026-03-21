variable "topic_name" {
  description = "SNS topic name"
  type        = string
}

resource "aws_sns_topic" "this" {
  name = var.topic_name
}

output "topic_arn" {
  value = aws_sns_topic.this.arn
}

output "topic_name" {
  value = aws_sns_topic.this.name
}
