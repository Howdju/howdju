output "db_instances_security_group" {
  value = aws_security_group.db_instances
}

output "bastion_instance_connect_endpoint" {
  value = aws_ec2_instance_connect_endpoint.bastion
}

output "bastion_instance" {
  value = aws_instance.bastion
}
