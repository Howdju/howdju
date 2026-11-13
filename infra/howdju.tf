provider "aws" {
  region = var.aws_region
  default_tags {
    tags = var.default_tags
  }
}

data "aws_caller_identity" "current" {}

module "constants" {
  source = "./modules/constants"
}

module "ecr" {
  source = "./modules/ecr"
}

module "lambdas" {
  source          = "./modules/lambdas"
  expiration_days = var.lambdas_s3_noncurrent_version_expiration_days
}

module "s3_backend" {
  source = "./modules/s3_backend"
}

data "aws_ami" "bastion" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-arm64"]
  }
}

module "bastion_connect" {
  source         = "./modules/bastion_connect"
  aws_region     = var.aws_region
  aws_account_id = data.aws_caller_identity.current.account_id
  vpc_id         = aws_vpc.default.id
  instance_ami   = data.aws_ami.bastion.id
  subnet_id      = data.aws_subnet.default_private_subnet_b.id
}

module "messages" {
  source                    = "./modules/messages"
  aws_region                = var.aws_region
  lambda_version            = "1.1.0"
  lambda_security_group_ids = [aws_default_security_group.default.id]
  lambda_subnet_ids         = [data.aws_subnet.default_private_subnet_b.id]
}
