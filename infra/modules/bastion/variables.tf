variable "vpc_id" {
  description = "The VPC into which to put resources"
}
variable "instance_type" {
  default     = "t3a.nano"
  description = "The instance type of the bastion instances"
}
variable "aws_region" {
  description = "The AWS region into which to place resources"
}
variable "key_pair_name" {
  description = "The key-pair name to use for the bastion instances"
}
variable "subnet_ids" {
  description = "The subnet IDs for the auto-scaling group and the load balancer"
  type        = list(string)
}
variable "logs_bucket_name" {
  description = "The name of the S3 bucket into which to log SSH commands"
}
variable "hosted_zone_id" {
  description = "ID of the hosted zone for the DNS record"
}
variable "bastion_record_name" {
  description = "The name of the DNS record to create"
}
variable "instance_count" {
  default     = 1
  description = "The number of bastion instances for the auto-scaling group"
}
variable "tags" {
  description = "Tags for all resources created by this module"
  type        = map(string)
}
