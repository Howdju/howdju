resource "aws_ec2_instance_connect_endpoint" "bastion" {
  security_group_ids = [aws_security_group.endpoint.id]
  subnet_id          = var.subnet_id
  // When client IP preservation is enabled, the instance to connect to must be in the same VPC as
  // the EC2 Instance Connect Endpoint.
  // https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/connect-using-eice.html#ec2-instance-connect-endpoint-limitations
  preserve_client_ip = false
}

resource "aws_security_group" "endpoint" {
  vpc_id = var.vpc_id
  name   = "instance-connect-endpoint"
}

resource "aws_vpc_security_group_ingress_rule" "internet_to_endpoint" {
  security_group_id = aws_security_group.endpoint.id
  ip_protocol       = "tcp"
  from_port         = 22
  to_port           = 22
  cidr_ipv4         = "0.0.0.0/0"
  description       = "Allow someone to connect to the endpoint from any IPv4 address."
}

resource "aws_vpc_security_group_egress_rule" "endpoint_to_bastion" {
  security_group_id            = aws_security_group.endpoint.id
  ip_protocol                  = "tcp"
  from_port                    = 22
  to_port                      = 22
  referenced_security_group_id = aws_security_group.bastion.id
  description                  = "Allow instance connect endpoint to connect to the bastion instance."
}

resource "aws_instance" "bastion" {
  ami                    = var.instance_ami
  instance_type          = var.instance_type
  subnet_id              = var.subnet_id
  vpc_security_group_ids = [aws_security_group.bastion.id]
  tags = {
    Name = "bastion"
  }
}

resource "aws_security_group" "bastion" {
  vpc_id = var.vpc_id
  name   = "bastion-instance"
}

resource "aws_vpc_security_group_ingress_rule" "endpoint_to_bastion" {
  security_group_id            = aws_security_group.bastion.id
  ip_protocol                  = "tcp"
  from_port                    = 22
  to_port                      = 22
  referenced_security_group_id = aws_security_group.endpoint.id
  description                  = "Allow endpoint to connect to bastion."
}

resource "aws_vpc_security_group_egress_rule" "bastion_to_rds_postgres" {
  security_group_id            = aws_security_group.bastion.id
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
  referenced_security_group_id = aws_security_group.db_instances.id
  description                  = "Allow bastion to tunnel to RDS on Postgres port."
}

resource "aws_security_group" "db_instances" {
  vpc_id      = var.vpc_id
  name        = "instance-connect-db-instances"
  description = "Security group for RDS instances that the bastion host can connect to."
}

resource "aws_iam_policy" "tunnel_ssh_to_bastion" {
  // See
  // https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/permissions-for-ec2-instance-connect-endpoint.html#iam-OpenTunnel
  // and
  // https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-connect-configure-IAM-role.html#eic-permissions-allow-users-to-connect-to-specific-instances
  name        = "bastion-ec2-instance-connect"
  description = "Allow a principal to use the bastion EC2 Instance Connect to tunnel SSH connections to the bastion host"
  policy = templatefile(
    "${path.module}/policy.json.tftpl",
    {
      aws_region          = var.aws_region
      aws_account_id      = var.aws_account_id
      eice_id             = aws_ec2_instance_connect_endpoint.bastion.id
      subnet_address      = jsonencode(data.aws_subnet.bastion.cidr_block)
      bastion_instance_id = aws_instance.bastion.id
  })
}

data "aws_subnet" "bastion" {
  id = var.subnet_id
}
