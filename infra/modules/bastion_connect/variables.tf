variable "instance_type" {
  default     = "t4g.nano"
  description = "The type of bastion EC2 instance to start"
}

variable "instance_ami" {
  description = "The AMI ID to use for the bastion EC2 instance"
}

variable "vpc_id" {
  description = "The VPC to launch the bastion instance in"
}

variable "subnet_id" {
  description = "The subnet to launch the bastion instance in. Should be private."
}

variable "aws_region" {}

variable "aws_account_id" {}
