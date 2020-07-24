resource "aws_lambda_function" "elasticsearch_snapshots" {
  function_name     = "ElasticsearchSnapshots"
  role              = aws_iam_role.elasticsearch_snapshots.arn
  handler           = "index.handler"
  runtime           = "nodejs8.10"
  s3_bucket         = data.aws_s3_bucket_object.lambda_function_zip.bucket
  s3_key            = data.aws_s3_bucket_object.lambda_function_zip.key
  s3_object_version = data.aws_s3_bucket_object.lambda_function_zip.version_id
  timeout           = var.lambda_timeout
  publish           = true
  vpc_config {
    security_group_ids = var.vpc_security_group_ids
    subnet_ids         = var.vpc_subnet_ids
  }
  environment {
    variables = {
      ELASTICSEARCH_AUTHORITY = var.elasticsearch_authority
      ELASTICSEARCH_LOG_LEVEL = var.log_level
      S3_BUCKET               = var.elasticsearch_repository_s3_bucket
    }
  }
}

resource "aws_lambda_alias" "elasticsearch_snapshots_live" {
  name             = "live"
  description      = "the live version of the lambda"
  function_name    = aws_lambda_function.elasticsearch_snapshots.arn
  function_version = var.live_lambda_version
}

data "aws_s3_bucket_object" "lambda_function_zip" {
  bucket = var.lambda_s3_bucket
  key    = var.lambda_s3_key
}

resource "aws_iam_role" "elasticsearch_snapshots" {
  name = "elasticsearch_snapshots_role"

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

data "aws_iam_policy" "AWSLambdaVPCAccessExecutionRole" {
  arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy_attachment" "cloudwatch_logs_to_elasticsearch" {
  role       = aws_iam_role.elasticsearch_snapshots.id
  policy_arn = data.aws_iam_policy.AWSLambdaVPCAccessExecutionRole.arn
}

