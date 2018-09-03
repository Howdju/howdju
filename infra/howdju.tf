provider "aws" {
  region = "${var.aws_region}"
  profile = "premiser"
}

data "aws_caller_identity" "current" {}

module "constants" {
  source = "modules/constants"
}

module "ecr" {
  source = "modules/ecr"
}

module "lambdas" {
  source = "modules/lambdas"
}

module "elasticstack" {
  // referencing this repo as a version should allow us to have different envs with different module versions
  // source = "git::git@bitbucket.org:howdju/premiser.git//infra/modules/elasticstack?ref=v0.0.1"
  source = "./modules/elasticstack"
  aws_account_id = "${data.aws_caller_identity.current.account_id}"
  aws_region = "${var.aws_region}"
  key_name = "${var.key_name}"
//  base_domain = "${var.base_domain}"
  instance_type = "${var.elasticstack_instance_type}"
  instance_subnet_id = "${data.aws_subnet.default.id}"
  elasticsearch_task_desired_count = "${var.elasticsearch_task_desired_count}"
  elasticsearch_repository_name = "${module.ecr.elasticsearch_repository_name}"
  elasticsearch_container_version = "${var.elasticsearch_container_version}"
  elasticsearch_task_cpu = "${var.elasticsearch_task_cpu}"
  elasticsearch_task_memory_mib = "${var.elasticsearch_task_memory_mib}"
  elasticsearch_log_group = "${var.elasticsearch_log_group}"
  elasticsearch_lb_port = "${module.constants.elasticsearch_port}"
  kibana_repository_name = "${module.ecr.kibana_repository_name}"
  kibana_container_version = "${var.kibana_container_version}"
  kibana_lb_port = "${module.constants.kibana_port}"
  vpc_id = "${aws_vpc.default.id}"
//  availability_zone_name = "${data.aws_availability_zone.public.name}"
  bastion_security_group_id = "${aws_security_group.bastion.id}"
//  subnet_ids = "${data.aws_subnet_ids.default.ids}"
  lb_arn = "${aws_lb.default_private.arn}"
  lb_security_group_id = "${aws_security_group.default_private_lb.id}"
  elasticsearch_ingress_cidr = "${aws_vpc.default.cidr_block}"
}

// ECS instances require a public address to communicate with ECS
resource "aws_eip" "elasticstack_instance" {
  vpc = true
  instance = "${module.elasticstack.instance_id}"
  depends_on = ["aws_internet_gateway.default"]
}

module "cloudwatch_to_elasticsearch" {
  source = "./modules/cloudwatch_to_elasticsearch"
  aws_region = "${var.aws_region}"
  aws_account_id = "${data.aws_caller_identity.current.account_id}"
  elasticsearch_host = "${aws_lb.default_private.dns_name}"
  elasticsearch_index = "logs"
  lambda_bucket = "${module.lambdas.lambda_bucket}"
  cloudwatch_logs_to_elasticsearch_lambda_s3_key = "cloudwatchLogsToElasticsearch/cloudwatchLogsToElasticsearch.zip"
  vpc_subnet_ids = ["${data.aws_subnet.default.id}"]
  vpc_security_group_ids = ["${aws_default_security_group.default.id}"]
}
