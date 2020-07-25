provider "aws" {
  region  = var.aws_region
  profile = "premiser"
  version = "~> 2.70.0"
}

provider "template" {
  version = "~> 2.1.2"
}

data "aws_caller_identity" "current" {
}

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

module bastion {
  source              = "./modules/bastion"
  instance_count      = 1
  aws_region          = var.aws_region
  vpc_id              = aws_vpc.default.id
  key_pair_name       = aws_key_pair.bastion.key_name
  hosted_zone_id      = data.aws_route53_zone.howdju.id
  bastion_record_name = "bastion.howdju.com."
  logs_bucket_name    = "howdju-bastion-logs"
  subnet_ids          = data.aws_subnet_ids.default.ids
}

module "elasticstack" {
  // referencing this repo as a version should allow us to have different envs with different module versions
  // source = "git::git@bitbucket.org:howdju/premiser.git//infra/modules/elasticstack?ref=v0.0.1"
  source         = "./modules/elasticstack"
  aws_account_id = data.aws_caller_identity.current.account_id
  aws_region     = var.aws_region
  key_name       = var.key_name

  instance_count                     = 0
  instance_type                      = var.elasticstack_instance_type
  instance_subnet_id                 = data.aws_subnet.default.id
  data_volume_availability_zone_name = data.aws_availability_zone.default.name
  elasticsearch_data_owner           = var.elasticsearch_data_owner

  elasticsearch_task_desired_count = var.elasticsearch_task_desired_count
  elasticsearch_repository_name    = module.ecr.elasticsearch_repository_name
  elasticsearch_container_version  = var.elasticsearch_container_version
  elasticsearch_task_cpu           = var.elasticsearch_task_cpu
  elasticsearch_task_memory_mib    = var.elasticsearch_task_memory_mib
  elasticsearch_data_path          = var.elasticsearch_data_path
  elasticsearch_log_group          = var.elasticsearch_log_group
  elasticsearch_lb_port            = module.constants.elasticsearch_port
  elasticsearch_lb_ingress_cidr    = aws_vpc.default.cidr_block

  kibana_repository_name   = module.ecr.kibana_repository_name
  kibana_container_version = var.kibana_container_version
  kibana_lb_port           = module.constants.kibana_port
  kibana_task_cpu          = var.kibana_task_cpu
  kibana_task_memory_mib   = var.kibana_task_memory_mib
  kibana_lb_ingress_cidr   = aws_vpc.default.cidr_block
  kibana_log_group         = var.kibana_log_group

  vpc_id                    = aws_vpc.default.id
  bastion_security_group_id = aws_security_group.bastion.id
  lb_arn                    = aws_lb.default_private.arn
  lb_security_group_id      = aws_security_group.default_private_lb.id
  lb_dns_name               = aws_lb.default_private.dns_name
}

module "cloudwatch_to_elasticsearch" {
  source                  = "./modules/cloudwatch_to_elasticsearch"
  aws_region              = var.aws_region
  aws_account_id          = data.aws_caller_identity.current.account_id
  lambda_timeout          = var.cloudwatch_to_elasticsearch_lambda_timeout
  elasticsearch_authority = module.elasticstack.elasticsearch_lb_authority
  elasticsearch_index     = var.cloudwatch_logs_elasticsearch_index
  elasticsearch_type      = var.cloudwatch_logs_elasticsearch_type
  elasticsearch_timeout   = var.cloudwatch_to_elasticsearch_elasticsearch_timeout
  lambda_s3_bucket        = module.lambdas.lambda_bucket
  lambda_s3_key           = var.cloudwatch_to_elasticsearch_lambda_s3_key
  vpc_subnet_ids          = [data.aws_subnet.default.id]
  vpc_security_group_ids  = [aws_default_security_group.default.id]
  live_lambda_version     = var.cloudwatch_to_elasticsearch_lambda_live_version
}

module "elasticsearch_snapshots" {
  source                             = "./modules/elasticsearch_snapshots"
  aws_region                         = var.aws_region
  aws_account_id                     = data.aws_caller_identity.current.account_id
  lambda_timeout                     = var.elasticsearch_snapshots_lambda_timeout
  elasticsearch_authority            = module.elasticstack.elasticsearch_lb_authority
  elasticsearch_repository_s3_bucket = var.elasticsearch_repository_s3_bucket
  log_level                          = var.elasticsearch_snapshots_lambda_log_level
  lambda_s3_bucket                   = module.lambdas.lambda_bucket
  lambda_s3_key                      = var.elasticsearch_snapshots_lambda_s3_key
  vpc_subnet_ids                     = [data.aws_subnet.default.id]
  vpc_security_group_ids             = [aws_default_security_group.default.id]
  live_lambda_version                = var.elasticsearch_snapshots_lambda_live_version
}

// ECS instances require a public address to communicate with ECS
resource "aws_eip" "elasticstack_instance" {
  vpc = true

  # should match instance_count of module elasticstack above
  count      = 0
  instance   = module.elasticstack.instance_ids[count.index]
  depends_on = [aws_internet_gateway.default]
}

resource aws_key_pair bastion {
  key_name   = "bastion"
  public_key = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDHp8MaA6/gmknphvBIPMncZF4Wo+tfiOaJgwR2NFzA2NaBODvSx9435t8t83T786W5y+BBOgUkSklMCjj8Q+Cz222nDnpAovYbKcLbxr5LzjQMrYoJlHzMBNGhQbOGoXzxnIjFkMHPaRLrCRa5v2LQ4hIz+JDUZXVv1XKjd1ovHt+mwgQHDnnWeAkiNGl8MDOj+Yib5sq7xtYAlgN97tPdHy2n5n71JQhDURNEW4t7RZawkTu31UdQKT6/KT3COwLkbfLPLv2DG5hPXy36zJMril71Ch5LX+vTZ99ZsOk5wD1+LalxIVFwBDLjjO+sMDXe0SdnyydIiKs/n8IyE8Bf"
}
