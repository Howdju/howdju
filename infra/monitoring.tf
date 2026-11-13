resource "aws_sns_topic" "api_lambda_notifications" {
  application_success_feedback_sample_rate = 0
  content_based_deduplication              = false
  display_name                             = "HowAwsLNot"
  fifo_topic                               = false
  firehose_success_feedback_sample_rate    = 0
  http_success_feedback_sample_rate        = 0
  lambda_success_feedback_sample_rate      = 0
  name                                     = "api-lambda-notifications"
  policy = jsonencode({
    Id = "__default_policy_ID"
    Statement = [{
      Action = ["SNS:GetTopicAttributes", "SNS:SetTopicAttributes", "SNS:AddPermission", "SNS:RemovePermission", "SNS:DeleteTopic", "SNS:Subscribe", "SNS:ListSubscriptionsByTopic", "SNS:Publish", "SNS:Receive"]
      Condition = {
        StringEquals = {
          "AWS:SourceOwner" = "007899441171"
        }
      }
      Effect = "Allow"
      Principal = {
        AWS = "*"
      }
      Resource = "arn:aws:sns:us-east-1:007899441171:api-lambda-notifications"
      Sid      = "__default_statement_ID"
    }]
    Version = "2008-10-17"
  })
  sqs_success_feedback_sample_rate = 0
  lifecycle {
    ignore_changes = [tags_all]
  }
}

resource "aws_cloudwatch_metric_alarm" "api_gateway_5xxerror_prod" {
  actions_enabled     = true
  alarm_actions       = [aws_sns_topic.api_lambda_notifications.arn]
  alarm_description   = "This alarm helps to detect a high rate of server-side errors. This can indicate that there is something wrong on the API backend, the network, or the integration between the API gateway and the backend API. This [documentation](https://repost.aws/knowledge-center/api-gateway-5xx-error) can help you troubleshoot the cause of 5xx errors."
  alarm_name          = "AWS/ApiGateway 5XXError ApiName=premiser Stage=prod"
  comparison_operator = "GreaterThanThreshold"
  datapoints_to_alarm = 3
  dimensions = {
    ApiName = "premiser"
    Stage   = "prod"
  }
  evaluation_periods = 3
  metric_name        = "5XXError"
  namespace          = "AWS/ApiGateway"
  period             = 60
  statistic          = "Average"
  threshold          = 0.01
  treat_missing_data = "notBreaching"
  lifecycle {
    ignore_changes = [tags_all]
  }
}

resource "aws_cloudwatch_metric_alarm" "count_apiname_premiser_stage_prod" {
  actions_enabled     = true
  alarm_actions       = [aws_sns_topic.api_lambda_notifications.arn]
  alarm_description   = "This alarm helps to detect low traffic volume for the REST API stage. This can be an indicator of an issue with the application calling the API such as using incorrect endpoints. It could also be an indicator of an issue with the configuration or permissions of the API making it unreachable for clients."
  alarm_name          = "AWS/ApiGateway Count ApiName=premiser Stage=prod"
  comparison_operator = "GreaterThanThreshold"
  datapoints_to_alarm = 10
  dimensions = {
    ApiName = "premiser"
    Stage   = "prod"
  }
  evaluation_periods = 10
  metric_name        = "Count"
  namespace          = "AWS/ApiGateway"
  period             = 60
  statistic          = "SampleCount"
  threshold          = 50
  treat_missing_data = "notBreaching"
  lifecycle {
    ignore_changes = [tags_all]
  }
}

resource "aws_cloudwatch_metric_alarm" "databaseconnections_dbinstanceidentifier_premiser" {
  actions_enabled     = true
  alarm_actions       = [aws_sns_topic.api_lambda_notifications.arn]
  alarm_description   = "This alarm detects a high number of connections. Review existing connections and terminate any that are in `sleep` state or that are improperly closed. Consider using connection pooling to limit the number of new connections. Alternatively, increase the DB instance size to use a class with more memory and hence a higher default value for `max_connections` or increase the `max_connections` value in [RDS](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_Limits.html) and Aurora [MySQL](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/AuroraMySQL.Managing.Performance.html) and [PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/AuroraPostgreSQL.Managing.html) for the current class if it can support your workload."
  alarm_name          = "AWS/RDS DatabaseConnections DBInstanceIdentifier=premiser"
  comparison_operator = "GreaterThanThreshold"
  datapoints_to_alarm = 5
  dimensions = {
    DBInstanceIdentifier = "premiser"
  }
  evaluation_periods = 5
  metric_name        = "DatabaseConnections"
  namespace          = "AWS/RDS"
  period             = 60
  statistic          = "Average"
  threshold          = 15
  treat_missing_data = "breaching"
  lifecycle {
    ignore_changes = [tags_all]
  }
}

resource "aws_cloudwatch_metric_alarm" "duration_functionname_premiserapi" {
  actions_enabled     = true
  alarm_actions       = [aws_sns_topic.api_lambda_notifications.arn]
  alarm_description   = "This alarm detects long duration times for processing an event by a Lambda function. Long durations might be because of changes in function code making the function take longer to execute, or the function's dependencies taking longer."
  alarm_name          = "AWS/Lambda Duration FunctionName=premiserApi"
  comparison_operator = "GreaterThanThreshold"
  datapoints_to_alarm = 5
  dimensions = {
    FunctionName = "premiserApi"
  }
  evaluation_periods = 5
  extended_statistic = "p90"
  metric_name        = "Duration"
  namespace          = "AWS/Lambda"
  period             = 60
  threshold          = 3000
  treat_missing_data = "notBreaching"
  lifecycle {
    ignore_changes = [tags_all]
  }
}

resource "aws_cloudwatch_metric_alarm" "errors_functionname_howdju_message_handler" {
  actions_enabled     = true
  alarm_actions       = [aws_sns_topic.api_lambda_notifications.arn]
  alarm_description   = "This alarm detects high error counts. Errors includes the exceptions thrown by the code as well as exceptions thrown by the Lambda runtime. You can check the logs related to the function to diagnose the issue."
  alarm_name          = "AWS/Lambda Errors FunctionName=howdju-message-handler"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  datapoints_to_alarm = 1
  dimensions = {
    FunctionName = "howdju-message-handler"
  }
  evaluation_periods = 1
  metric_name        = "Errors"
  namespace          = "AWS/Lambda"
  period             = 60
  statistic          = "Sum"
  threshold          = 1
  treat_missing_data = "missing"
  lifecycle {
    ignore_changes = [tags_all]
  }
}

resource "aws_cloudwatch_metric_alarm" "errors_functionname_premiserapi" {
  actions_enabled     = true
  alarm_actions       = [aws_sns_topic.api_lambda_notifications.arn]
  alarm_description   = "This alarm detects high error counts. Errors includes the exceptions thrown by the code as well as exceptions thrown by the Lambda runtime. You can check the logs related to the function to diagnose the issue."
  alarm_name          = "AWS/Lambda Errors FunctionName=premiserApi"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  datapoints_to_alarm = 1
  dimensions = {
    FunctionName = "premiserApi"
  }
  evaluation_periods = 1
  metric_name        = "Errors"
  namespace          = "AWS/Lambda"
  period             = 60
  statistic          = "Sum"
  threshold          = 1
  treat_missing_data = "missing"
  lifecycle {
    ignore_changes = [tags_all]
  }
}

resource "aws_cloudwatch_metric_alarm" "latency_apiname_premiser_stage_prod" {
  actions_enabled     = true
  alarm_actions       = [aws_sns_topic.api_lambda_notifications.arn]
  alarm_description   = "This alarm detects high latency in a stage. Find the `IntegrationLatency` metric value to check the API backend latency. If the two metrics are mostly aligned, the API backend is the source of higher latency and you should investigate there for issues. Consider also enabling CloudWatch Logs and checking for errors that might be causing the high latency. Moreover, consider enabling detailed CloudWatch metrics to view this metric per resource and method and narrow down the source of the latency. If applicable, refer to the [troubleshooting with Lambda](https://repost.aws/knowledge-center/api-gateway-high-latency-with-lambda) or [troubleshooting for edge-optimized API endpoints](https://repost.aws/knowledge-center/source-latency-requests-api-gateway) guides."
  alarm_name          = "AWS/ApiGateway Latency ApiName=premiser Stage=prod"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  datapoints_to_alarm = 5
  dimensions = {
    ApiName = "premiser"
    Stage   = "prod"
  }
  evaluation_periods = 5
  extended_statistic = "p90"
  metric_name        = "Latency"
  namespace          = "AWS/ApiGateway"
  period             = 900
  threshold          = 5000
  treat_missing_data = "notBreaching"
  lifecycle {
    ignore_changes = [tags_all]
  }
}

resource "aws_cloudwatch_metric_alarm" "throttles_functionname_premiserapi" {
  actions_enabled     = true
  alarm_actions       = [aws_sns_topic.api_lambda_notifications.arn]
  alarm_description   = "This alarm detects a high number of throttled invocation requests. Throttling occurs when there is no concurrency is available for scale up. There are several approaches to resolve this issue. 1) Request a concurrency increase from AWS Support in this Region. 2) Identify performance issues in the function to improve the speed of processing and therefore improve throughput. 3) Increase the batch size of the function, so that more messages are processed by each function invocation."
  alarm_name          = "AWS/Lambda Throttles FunctionName=premiserApi"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  datapoints_to_alarm = 1
  dimensions = {
    FunctionName = "premiserApi"
  }
  evaluation_periods = 1
  metric_name        = "Throttles"
  namespace          = "AWS/Lambda"
  period             = 60
  statistic          = "Sum"
  threshold          = 1
  treat_missing_data = "missing"
  lifecycle {
    ignore_changes = [tags_all]
  }
}
