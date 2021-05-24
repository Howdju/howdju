module "bastion" {
  source                       = "Guimove/bastion/aws"
  version                      = "2.2.2"
  bucket_name                  = var.logs_bucket_name
  region                       = var.aws_region
  vpc_id                       = var.vpc_id
  is_lb_private                = false
  bastion_launch_template_name = "bastion"
  instance_type                = var.instance_type
  bastion_host_key_pair        = var.key_pair_name
  create_dns_record            = true
  hosted_zone_id               = var.hosted_zone_id
  bastion_record_name          = var.bastion_record_name
  elb_subnets                  = var.subnet_ids
  auto_scaling_group_subnets   = var.subnet_ids
  tags = {
    "Terraform" : "true",
  }
  bastion_instance_count = var.instance_count
}
