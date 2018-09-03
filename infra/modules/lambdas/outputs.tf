output "lambda_bucket" {
  value = "${aws_s3_bucket.lambda.bucket}"
}