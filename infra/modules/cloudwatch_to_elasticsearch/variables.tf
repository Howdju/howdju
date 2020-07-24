variable "aws_region" {
}

variable "aws_account_id" {
}

variable "lambda_timeout" {
}

variable "elasticsearch_authority" {
}

variable "elasticsearch_index" {
}

variable "elasticsearch_type" {
}

variable "elasticsearch_timeout" {
}

variable "lambda_s3_bucket" {
}

variable "lambda_s3_key" {
}

//variable "cloudwatch_logs_to_elasticsearch_lambda_zip_file_path" {
//  default = "cloudwatch_logs_to_elasticsearch.zip"
//}
variable "vpc_subnet_ids" {
  type = list(string)
}

variable "vpc_security_group_ids" {
  type = list(string)
}

variable "live_lambda_version" {
}

