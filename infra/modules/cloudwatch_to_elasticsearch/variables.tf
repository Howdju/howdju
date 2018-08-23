variable "aws_region" {}
variable "aws_account_id" {}
variable "elasticsearch_host" {}
variable "elasticsearch_index" {}
variable "cloudwatch_logs_to_elasticsearch_lambda_s3_key" {
  default = "cloudwatch_logs_to_elasticsearch/lambda.zip"
}
variable "cloudwatch_logs_to_elasticsearch_lambda_zip_file_path" {
  default = "cloudwatch_logs_to_elasticsearch.zip"
}