variable "runtime_name" {
  description = "Name of the AgentCore Runtime"
  type        = string
}

variable "description" {
  description = "Runtime description"
  type        = string
  default     = "Second Brain MCP server — knowledge graph tools"
}

variable "role_arn" {
  description = "IAM role ARN for the runtime"
  type        = string
}

variable "s3_bucket" {
  description = "S3 bucket containing the runtime code"
  type        = string
}

variable "s3_key" {
  description = "S3 key for the runtime code zip"
  type        = string
}

variable "environment_variables" {
  description = "Environment variables for the runtime"
  type        = map(string)
  default     = {}
}

# --- Runtime ---

resource "aws_bedrockagentcore_agent_runtime" "this" {
  agent_runtime_name = var.runtime_name
  description        = var.description
  role_arn           = var.role_arn

  agent_runtime_artifact {
    code_configuration {
      entry_point = ["mcp_server.py"]
      runtime     = "PYTHON_3_13"

      code {
        s3 {
          bucket = var.s3_bucket
          prefix = var.s3_key
        }
      }
    }
  }

  environment_variables = var.environment_variables

  network_configuration {
    network_mode = "PUBLIC"
  }

  protocol_configuration {
    server_protocol = "MCP"
  }
}

# --- Endpoint ---

resource "aws_bedrockagentcore_agent_runtime_endpoint" "this" {
  name             = "${var.runtime_name}_endpoint"
  agent_runtime_id = aws_bedrockagentcore_agent_runtime.this.agent_runtime_id
  description      = "MCP endpoint for ${var.runtime_name}"
}

# --- Outputs ---

output "runtime_id" {
  value = aws_bedrockagentcore_agent_runtime.this.agent_runtime_id
}

output "runtime_arn" {
  value = aws_bedrockagentcore_agent_runtime.this.agent_runtime_arn
}

output "endpoint_arn" {
  value = aws_bedrockagentcore_agent_runtime_endpoint.this.agent_runtime_endpoint_arn
}
