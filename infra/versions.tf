
terraform {
  required_version = ">= 0.13"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.0"
    }
  }
  backend "s3" {
    // Versioning should be enabled to allow rollback in case of human error
    bucket = "howdju-terraform"
    key    = "terraform-state/terraform.tfstate"
    region = "us-east-1"
    dynamodb_table = "TerraformStateLock"
  }
}
