resource "aws_s3_bucket" "lambda" {
  bucket = "howdju-lambdas"
  acl    = "private"
}
