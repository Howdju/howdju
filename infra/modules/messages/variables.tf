variable "aws_region" {}

variable "lambda_version" {}

variable "lambda_security_group_ids" {
  type = list(string)
}

variable "lambda_subnet_ids" {
  type = list(string)
}
