module "lambdas" {
  source = "../lambdas"
}

resource "aws_lambda_function" "cloudwatch_logs_to_elasticsearch" {
  function_name = "cloudwatch_logs_to_elasticsearch"
  role = "${aws_iam_role.cloudwatch_logs_to_elasticsearch.arn}"
  handler = "handler.handler"
  runtime = "nodejs8.10"
  s3_bucket = "${module.lambdas.lambda_bucket}"
  s3_key = "${var.cloudwatch_logs_to_elasticsearch_lambda_s3_key}"
  environment {
    variables = {
      ELASTICSEARCH_HOST = "${var.elasticsearch_host}",
      ELASTICSEARCH_INDEX = "${var.elasticsearch_index}"
    }
  }
}

resource "aws_s3_bucket_object" "object" {
  bucket = "${module.lambdas.lambda_bucket}"
  key    = "${var.cloudwatch_logs_to_elasticsearch_lambda_s3_key}"
  source = "${var.cloudwatch_logs_to_elasticsearch_lambda_zip_file_path}"
  etag   = "${md5(file(${var.cloudwatch_logs_to_elasticsearch_lambda_zip_file_path}))}"
}


resource "aws_iam_role" "cloudwatch_logs_to_elasticsearch" {
  name = "cloudwatch_logs_to_elasticsearch role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": "CloudWatchLogsToElasticSearch"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy" "cloudwatch_logs_to_elasticsearch" {
  name = "cloudwatch_logs_to_elasticsearch role policy"
  role = "${aws_iam_role.cloudwatch_logs_to_elasticsearch.id}"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CopiedFromTemplateAWSLambdaVPCAccessExecutionRole1",
      "Effect": "Allow",
      "Action": [
        "ec2:CreateNetworkInterface"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CopiedFromTemplateAWSLambdaVPCAccessExecutionRole2",
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeNetworkInterfaces",
        "ec2:DeleteNetworkInterface"
      ],
      "Resource": "arn:aws:ec2:${var.aws_region}:${var.aws_account_id}:network-interface/*"
    },
    {
      "Sid": "CopiedFromTemplateAWSLambdaBasicExecutionRole1",
      "Effect": "Allow",
      "Action": "logs:CreateLogGroup",
      "Resource": "arn:aws:logs:${var.aws_region}:${var.aws_account_id}:*"
    },
    {
      "Sid": "CopiedFromTemplateAWSLambdaBasicExecutionRole2",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": [
        "arn:aws:logs:${var.aws_region}:${var.aws_account_id}:log-group:/aws/lambda/*"
      ]
    }
  ]
}
EOF
}

