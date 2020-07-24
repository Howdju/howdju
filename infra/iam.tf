resource "aws_iam_group" "build_tools" {
  name = "BuildTools"
  path = "/"
}

resource "aws_iam_policy" "read_write_lambda_bucket" {
  name        = "read_write_lambda_bucket"
  path        = "/"
  description = "Allows listing and put/get/delete of the Lambdas bucket"
  policy      = data.aws_iam_policy_document.read_write_lambda_bucket.json
}

data "aws_iam_policy_document" "read_write_lambda_bucket" {
  statement {
    actions   = ["s3:ListBucket"]
    resources = ["arn:aws:s3:::${module.lambdas.lambda_bucket}"]
  }
  statement {
    actions = [
      "s3:PutObject",
      "s3:GetObject",
      "s3:DeleteObject",
    ]
    resources = ["arn:aws:s3:::${module.lambdas.lambda_bucket}/*"]
  }
}

resource "aws_iam_group_policy_attachment" "read_write_lambda_bucket" {
  group      = aws_iam_group.build_tools.name
  policy_arn = aws_iam_policy.read_write_lambda_bucket.arn
}

