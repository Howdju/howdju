variable "aws_region" {
  default = "us-east-1"
}

variable "key_name" {
  default = "premiser"
}

variable "base_domain" {
  default = "howdju.com"
}

variable "lambdas_s3_noncurrent_version_expiration_days" {
  default = 10
}

// The AWS provider default_tags cannot apply to autoscaling groups
// (https://www.hashicorp.com/blog/default-tags-in-the-terraform-aws-provider)
// So we store them here, too.
variable "default_tags" {
  default = {
    Terraform = "true"
  }
  description = "Default Tags for all Terraform-managed AWS resources"
  type        = map(string)
}
