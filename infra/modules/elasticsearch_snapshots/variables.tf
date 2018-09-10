variable "aws_region" {}
variable "aws_account_id" {}
variable "lambda_timeout" {}
variable "elasticsearch_authority" {}
variable "log_level" {}
variable "elasticsearch_repository_s3_bucket" {}
variable "lambda_s3_key" {}
variable "lambda_s3_bucket" {}
variable "vpc_subnet_ids" {type = "list"}
variable "vpc_security_group_ids" {type = "list"}
variable "live_lambda_version" {}
