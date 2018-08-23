data "aws_cloudwatch_log_group" "premiser_api" {
  name = "/aws/lambda/premiserApi"
}

module "subscribe_lambda_to_log_group" {
  source = "./subscribe_lambda_to_log_group"
  aws_region = "${var.aws_region}"
  lambda_function_arn = "${aws_lambda_function.cloudwatch_logs_to_elasticsearch.arn}"
  lambda_function_name = "${aws_lambda_function.cloudwatch_logs_to_elasticsearch.function_name}"
  source_log_group_name = "${data.aws_cloudwatch_log_group.premiser_api.name}"
  source_log_group_arn = "${data.aws_cloudwatch_log_group.premiser_api.arn}"
}
