resource "aws_s3_bucket" "lambda" {
  bucket = "howdju-lambdas"
}

resource "aws_s3_bucket_lifecycle_configuration" "lambda" {
  bucket                                 = aws_s3_bucket.lambda.id
  transition_default_minimum_object_size = "varies_by_storage_class"
  rule {
    id     = "lambda-versions"
    status = "Enabled"
    filter {}
    noncurrent_version_expiration {
      noncurrent_days = var.expiration_days
    }
  }
}

resource "aws_s3_bucket_acl" "lambda" {
  bucket = aws_s3_bucket.lambda.id
  acl    = "private"
}

resource "aws_s3_bucket_versioning" "lambda" {
  bucket = aws_s3_bucket.lambda.bucket
  versioning_configuration {
    status = "Enabled"
  }
}
