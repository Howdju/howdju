resource "aws_s3_bucket" "lambda" {
  bucket = "howdju-lambdas"
  acl    = "private"
  versioning {
    enabled = true
  }
  lifecycle_rule {
    enabled = true
    noncurrent_version_expiration {
      days = "${var.expiration_days}"
    }
  }
}
