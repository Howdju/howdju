# Terraform docs: https://www.terraform.io/docs/language/settings/backends/s3.html
# Info on DynamoDB schema: https://medium.com/@mitesh_shamra/state-management-with-terraform-9f13497e54cf

resource "aws_s3_bucket" "terraform_state" {
  bucket = "howdju-terraform"
  versioning {
    enabled = true
  }
}

resource "aws_dynamodb_table" "terraform_state_lock" {
  name         = "TerraformStateLock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}

resource "aws_iam_role" "terraform_state_updater" {
  name = "TerraformStateUpdater"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Sid    = ""
        Principal = {
          AWS: [
            "arn:aws:iam::007899441171:user/carl"
          ]
        }
      },
    ]
  })
}

resource "aws_iam_policy" "terraform_state_update" {
  name        = "TerraformStateUpdate"
  description = "Allows updating Terraform state"

  policy = jsonencode({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: "s3:ListBucket",
        Resource: "arn:aws:s3:::howdju-terraform"
      },
      {
        Effect: "Allow",
        Action: ["s3:GetObject", "s3:PutObject"],
        Resource: "arn:aws:s3:::${aws_s3_bucket.terraform_state.bucket}/terraform-state/*"
      },
      {
        Effect: "Allow",
        Action: [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem"
        ],
        Resource: "arn:aws:dynamodb:*:*:table/${aws_dynamodb_table.terraform_state_lock.name}"
      }
    ]
  })
}

resource aws_iam_role_policy_attachment "terraform_state_updater" {
  policy_arn = aws_iam_policy.terraform_state_update.arn
  role       = aws_iam_role.terraform_state_updater.name
}
