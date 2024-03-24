resource "aws_ec2_instance_connect_endpoint" "rds_connect" {
  security_group_ids = [aws_security_group.instance_connect_security_group.id]
  subnet_id          = var.subnet_id
}

resource "aws_security_group" "instance_connect_security_group" {
  vpc_id = var.vpc_id
  name   = "rds-instance-connect-security-group"
}

resource "aws_vpc_security_group_egress_rule" "rds_connect" {
  security_group_id            = aws_security_group.instance_connect_security_group.id
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
  referenced_security_group_id = var.rds_security_group_id
  description                  = "Outbound connection from EC2 Instance Connect Endpoint to RDS"
}

resource "aws_iam_policy" "rds_connect" {
  name        = "rds-connect"
  description = "IAM policy for RDS Connect"
  policy = templatefile(
    "${path.module}/policy.json.tftpl",
    {
      aws_region       = var.aws_region
      aws_account_id   = var.aws_account_id
      eice_id          = aws_ec2_instance_connect_endpoint.rds_connect.id
      subnet_addresses = jsonencode([for s in data.aws_subnet.premiser_db : s.cidr_block])
  })
}

data "aws_subnet" "premiser_db" {
  for_each = toset(data.aws_subnets.premiser_db.ids)
  id       = each.value
}

data "aws_subnets" "premiser_db" {
  filter {
    name   = "subnet-id"
    values = data.aws_db_subnet_group.premiser_db.subnet_ids
  }
  filter {
    name   = "availability-zone"
    values = [data.aws_db_instance.premiser_db.availability_zone]
  }
}

data "aws_db_subnet_group" "premiser_db" {
  name = data.aws_db_instance.premiser_db.db_subnet_group
}


data "aws_db_instance" "premiser_db" {
  db_instance_identifier = "premiser"
}
