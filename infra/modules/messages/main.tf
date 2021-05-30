resource "aws_sns_topic" "howdju_messages" {
  name = "howdju-messages"
}

locals {
  lambda_name = "howdju-message-handler"
}

resource "aws_sns_topic_subscription" "howdju_messages_lambda" {
  topic_arn = aws_sns_topic.howdju_messages.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.howdju_messages_handler.arn
}

resource "aws_lambda_permission" "allow_sns" {
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.howdju_messages_handler.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.howdju_messages.arn
}

resource "aws_lambda_function" "howdju_messages_handler" {
  function_name = "howdju-message-handler"
  role          = aws_iam_role.message_handler_lambda.arn
  s3_bucket     = "howdju-lambdas"
  s3_key        = "${local.lambda_name}/${local.lambda_name}-${var.lambda_version}.zip"
  handler       = "index.handler"
  runtime       = "nodejs14.x"
  environment {
    variables = {
      DEFAULT_AWS_REGION = var.aws_region
    }
  }
}

resource "aws_iam_role_policy_attachment" "lambda_ses_send_email" {
  role       = aws_iam_role.message_handler_lambda.name
  policy_arn = aws_iam_policy.ses_send_email.arn
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.message_handler_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role" "message_handler_lambda" {
  name = "message_handler_lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Sid    = ""
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      },
    ]
  })
  tags = {
    Terraform = "true"
  }
}

resource "aws_iam_policy" "ses_send_email" {
  name        = "ses_send_email"
  description = "Allows the role to send email via SES"

  policy = jsonencode({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: [
            "ses:*"
        ],
        Resource: "*"
      }
    ]
  })
}
