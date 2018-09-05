resource "aws_lambda_function" "cloudwatch_logs_to_elasticsearch" {
  function_name = "CloudwatchLogsToElasticsearch"
  role = "${aws_iam_role.cloudwatch_logs_to_elasticsearch.arn}"
  handler = "index.handler"
  runtime = "nodejs8.10"
  s3_bucket = "${data.aws_s3_bucket_object.lambda.bucket}"
  s3_key = "${data.aws_s3_bucket_object.lambda.key}"
  s3_object_version = "${data.aws_s3_bucket_object.lambda.version_id}"
  vpc_config {
    security_group_ids = ["${var.vpc_security_group_ids}"]
    subnet_ids = ["${var.vpc_subnet_ids}"]
  }
  environment {
    variables = {
      ELASTICSEARCH_AUTHORITY = "${var.elasticsearch_authority}",
      ELASTICSEARCH_INDEX = "${var.elasticsearch_index}"
      ELASTICSEARCH_TYPE = "${var.elasticsearch_type}"
    }
  }
}

data "aws_s3_bucket_object" "lambda" {
  bucket = "${var.lambda_bucket}"
  key    = "${var.cloudwatch_logs_to_elasticsearch_lambda_s3_key}"
}

// The lambda zip file will be uploaded by node
//resource "aws_s3_bucket_object" "cloudwatch_logs_to_elasticsearch_lambda_function_zip_file" {
//  bucket = "${var.lambda_bucket}"
//  key    = "${var.cloudwatch_logs_to_elasticsearch_lambda_s3_key}"
//  source = "${var.cloudwatch_logs_to_elasticsearch_lambda_zip_file_path}"
//  etag   = "${md5(file(${var.cloudwatch_logs_to_elasticsearch_lambda_zip_file_path}))}"
//}

resource "aws_iam_role" "cloudwatch_logs_to_elasticsearch" {
  name = "cloudwatch_logs_to_elasticsearch_role"

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

//resource "aws_iam_policy" "cloudwatch_logs_to_elasticsearch" {
//  name = "cloudwatch_logs_to_elasticsearch_role_policy"
//  policy = "${data.aws_iam_policy_document.cloudwatch_logs_to_elasticsearch.json}"
//}

data "aws_iam_policy" "AWSLambdaVPCAccessExecutionRole" {
  arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

// cf. AWSLambdaBasicExecutionRole or AWSLambdaVPCAccessExecutionRole
//data "aws_iam_policy_document" "cloudwatch_logs_to_elasticsearch" {
//  statement {
//    actions = ["ec2:CreateNetworkInterface"]
//    resources = ["*"]
//  }
//  statement {
//    actions = [
//      "ec2:DescribeNetworkInterfaces",
//      "ec2:DeleteNetworkInterface"
//    ]
//    resources = ["arn:aws:ec2:${var.aws_region}:${var.aws_account_id}:network-interface/*"]
//  }
//  statement {
//    actions = ["logs:CreateLogGroup"]
//    resources = ["arn:aws:logs:${var.aws_region}:${var.aws_account_id}:*"]
//  }
//  statement {
//    actions = [
//      "logs:CreateLogStream",
//      "logs:PutLogEvents"
//    ]
//    resources = ["arn:aws:logs:${var.aws_region}:${var.aws_account_id}:log-group:/aws/lambda/${aws_lambda_function.cloudwatch_logs_to_elasticsearch.function_name}"]
//  }
//}

resource "aws_iam_role_policy_attachment" "cloudwatch_logs_to_elasticsearch" {
  role = "${aws_iam_role.cloudwatch_logs_to_elasticsearch.id}"
  policy_arn = "${data.aws_iam_policy.AWSLambdaVPCAccessExecutionRole.arn}"
}