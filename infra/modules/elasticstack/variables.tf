variable "aws_account_id" {
}

variable "aws_region" {
}

variable "key_name" {
}

variable "instance_count" {
  default = 1
}

variable "instance_type" {
}

variable "instance_subnet_id" {
}

variable "data_volume_availability_zone_name" {
}

variable "elasticsearch_data_owner" {
}

variable "elasticsearch_task_desired_count" {
}

variable "elasticsearch_repository_name" {
}

variable "elasticsearch_container_version" {
}

variable "elasticsearch_task_cpu" {
}

variable "elasticsearch_task_memory_mib" {
}

variable "elasticsearch_data_path" {
}

variable "elasticsearch_log_group" {
}

variable "elasticsearch_lb_port" {
}

variable "kibana_repository_name" {
}

variable "kibana_container_version" {
}

variable "kibana_lb_port" {
}

variable "kibana_task_cpu" {
}

variable "kibana_task_memory_mib" {
}

variable "kibana_log_group" {
}

variable "kibana_lb_ingress_cidr" {
}

variable "vpc_id" {
}

variable "bastion_security_group_id" {
}

variable "lb_arn" {
}

variable "lb_security_group_id" {
}

variable "lb_dns_name" {
}

variable "elasticsearch_lb_ingress_cidr" {
}

