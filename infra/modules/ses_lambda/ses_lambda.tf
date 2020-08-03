# Creates a VPC containing for running a Lambda against an SES Endpoint
# https://docs.aws.amazon.com/ses/latest/DeveloperGuide/send-email-set-up-vpc-endpoints.html
# https://aws.amazon.com/blogs/aws/new-amazon-simple-email-service-ses-for-vpc-endpoints/
# https://docs.aws.amazon.com/lambda/latest/dg/configuration-vpc.html

variable "lambda_package_path" {}

locals {
  subnet_count     = length(data.aws_availability_zones.non_local.names)
  cidr_block      = "10.0.0.0/16"
  region           = "us-east-1"
  smtp_ports       = [25, 465, 587, 2465, 2587]
}

resource "aws_vpc" "ses_test" {
  cidr_block = local.cidr_block
  enable_dns_hostnames = true
  tags = {
    Name      = "ses_test"
    Terraform = "true"
  }
}

resource "aws_subnet" "ses_test" {
  count             = local.subnet_count
  vpc_id            = aws_vpc.ses_test.id
  cidr_block        = cidrsubnet(local.cidr_block, ceil(log(local.subnet_count, 2)), count.index)
  availability_zone = data.aws_availability_zones.non_local.names[count.index]
  tags = {
    Name      = "ses_test"
    Terraform = "true"
  }
}

data "aws_availability_zones" "non_local" {
  # No Local Zones
  # https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/availability_zones#by-filter
  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }
}

resource "aws_security_group" "allow_smtp" {
  name        = "allow_smtp"
  description = "Allow SMTP inbound traffic"
  vpc_id      = aws_vpc.ses_test.id
  tags = {
    Terraform = "true"
  }
}

resource "aws_security_group_rule" "allow_smtp" {
  count                    = length(local.smtp_ports)
  security_group_id        = aws_security_group.allow_smtp.id
  type                     = "ingress"
  from_port                = local.smtp_ports[count.index]
  to_port                  = local.smtp_ports[count.index]
  protocol                 = "tcp"
  // source_security_group_id = aws_security_group.ses_client.id
  cidr_blocks = [local.cidr_block]
}

resource "aws_vpc_endpoint" "ses" {
  vpc_id              = aws_vpc.ses_test.id
  service_name        = "com.amazonaws.${local.region}.email-smtp"
  vpc_endpoint_type   = "Interface"
  security_group_ids  = [aws_security_group.allow_smtp.id]
  private_dns_enabled = true
  # Take the first one for cost-saving
  # (ids is a set, so list it.  Hopefully ordering is consistent.)
  subnet_ids = [tolist(data.aws_subnet_ids.ses.ids)[0]]
  tags = {
    Name      = "Test SES Endpoint"
    Terraform = "true"
  }
}

//resource "aws_vpc_endpoint_route_table_association" ses {
//  vpc_endpoint_id = aws_vpc_endpoint.ses.id
//  route_table_id  = aws_route_table.ses_endpoint.id
//}
//
//resource "aws_route_table" "ses_endpoint" {
//  vpc_id = aws_vpc.ses_test.id
//
//  tags = {
//    Name      = "SES Test"
//    Terraform = "true"
//  }
//}

data "aws_vpc_endpoint_service" "ses" {
  service = "email-smtp"
}

data "aws_subnet_ids" "ses" {
  vpc_id = aws_vpc.ses_test.id

  filter {
    name   = "subnet-id"
    values = aws_subnet.ses_test.*.id
  }

  filter {
    name   = "availability-zone"
    values = data.aws_vpc_endpoint_service.ses.availability_zones
  }
}

resource "aws_iam_role" "ses_test_lambda" {
  name = "ses_test"

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
      "Sid": ""
    }
  ]
}
EOF
  tags = {
    Terraform = "true"
  }
}

resource "aws_iam_policy" "ses_send_email" {
  name        = "ses_send_email"
  description = "Allows the role to send email via SES"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
          "ses:*"
      ],
      "Resource": "*"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "lambda_ses_send_email" {
  role       = aws_iam_role.ses_test_lambda.name
  policy_arn = aws_iam_policy.ses_send_email.arn
}

resource "aws_iam_role_policy_attachment" "lambda_vpc_execution" {
  role       = aws_iam_role.ses_test_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_security_group" "ses_client" {
  name        = "ses_client"
  description = "Identifies resources that can access SES"
  vpc_id      = aws_vpc.ses_test.id
  tags = {
    Name      = "ses_client"
    Terraform = "true"
  }
}

resource "aws_lambda_function" "ses_test" {
  function_name    = "ses_test"
  filename         = var.lambda_package_path
  role             = aws_iam_role.ses_test_lambda.arn
  handler          = "sesTest.handler"
  source_code_hash = filebase64sha256(var.lambda_package_path)
  vpc_config {
    subnet_ids = aws_vpc_endpoint.ses.subnet_ids
    security_group_ids = [
      aws_security_group.ses_client.id
    ]
  }

  runtime = "nodejs12.x"

  environment {
    variables = {
      aws_region = local.region
      //  ses_endpoint = "email-smtp.us-east-1.amazonaws.com"
      ses_endpoint = lookup(aws_vpc_endpoint.ses.dns_entry[0], "dns_name")
    }
  }
  tags = {
    Terraform = "true"
  }
}
