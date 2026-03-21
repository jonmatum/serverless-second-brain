terraform {
  required_version = ">= 1.5"

  backend "s3" {
    bucket         = "ssb-terraform-state"
    key            = "ssb/prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "ssb-terraform-lock"
    encrypt        = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# --- Memory Layer ---

module "dynamodb" {
  source     = "../../modules/dynamodb"
  table_name = "${var.project_name}-${var.environment}-knowledge-graph"
}

module "s3_content" {
  source      = "../../modules/s3"
  bucket_name = "${var.project_name}-${var.environment}-content"
}

# --- IAM Policies ---

module "iam" {
  source             = "../../modules/iam"
  project_name       = var.project_name
  environment        = var.environment
  dynamodb_table_arn = module.dynamodb.table_arn
  s3_bucket_arn      = module.s3_content.bucket_arn
}

# --- Compute Layer ---

module "capture_lambda" {
  source        = "../../modules/lambda"
  function_name = "${var.project_name}-${var.environment}-capture"
  memory_size   = 512
  timeout       = 30

  environment_variables = {
    TABLE_NAME       = module.dynamodb.table_name
    BUCKET_NAME      = module.s3_content.bucket_name
    BEDROCK_MODEL_ID = var.bedrock_model_id
    ENVIRONMENT      = var.environment
  }

  policy_arns = [
    module.iam.dynamodb_write_policy_arn,
    module.iam.s3_write_policy_arn,
    module.iam.bedrock_invoke_policy_arn,
  ]
}
