output "bastion_instance_id" {
  value       = module.bastion_connect.bastion_instance.id
  description = "The ID of the bastion instance"
}

output "bastion_instance_connect_endpoint_id" {
  value       = module.bastion_connect.bastion_instance_connect_endpoint.id
  description = "The ID of the bastion instance connect endpoint"
}

output "bastion_db_instances_security_group_id" {
  value       = module.bastion_connect.db_instances_security_group.id
  description = "The ID of the security group for RDS instances that the bastion host can connect to"
}
