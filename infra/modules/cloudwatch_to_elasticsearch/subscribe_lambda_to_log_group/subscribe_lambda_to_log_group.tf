# based upon: https://hackernoon.com/centralised-logging-for-aws-lambda-b765b7ca9152

variable "aws_region" {
}

variable "source_log_group_name" {
}

variable "source_log_group_arn" {
}

variable "lambda_function_arn" {
}

variable "lambda_function_name" {
}

variable "lambda_function_qualifier" {
}

resource "aws_cloudwatch_log_subscription_filter" "subscription_filter" {
  name           = "${var.lambda_function_name}_${var.lambda_function_qualifier}${replace(var.source_log_group_name, "/", "_")}_subscription_filter"
  log_group_name = var.source_log_group_name

  // Docs say that filterName is required and that updates fail if the same filterName is not provided,
  // But this terraform resource doesn't support filterName.
  // https://docs.aws.amazon.com/AmazonCloudWatchLogs/latest/APIReference/API_PutSubscriptionFilter.html#CWL-PutSubscriptionFilter-request-filterName
  filter_pattern  = ""
  destination_arn = var.lambda_function_arn
}

resource "aws_lambda_permission" "allow_cloudwatch" {
  statement_id  = "AllowExecutionFromCloudWatchLogs"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_name
  principal     = "logs.${var.aws_region}.amazonaws.com"
  source_arn    = var.source_log_group_arn
  qualifier     = var.lambda_function_qualifier
}

