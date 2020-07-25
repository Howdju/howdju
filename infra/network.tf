resource "aws_vpc" "default" {
  cidr_block = "172.31.0.0/16"
  tags = {
    Name      = "default-vpc"
    Terraform = "true"
  }
}

resource "aws_internet_gateway" "default" {
  vpc_id = aws_vpc.default.id
  tags = {
    Name      = "default-igw"
    Terraform = "true"
  }
}

resource "aws_default_route_table" "default" {
  default_route_table_id = aws_vpc.default.default_route_table_id

  route {
    cidr_block = module.constants.cidr_block_all

    // ipv6_cidr_block = "::/0"
    gateway_id = aws_internet_gateway.default.id
  }

  tags = {
    Name      = "default-rtb"
    Terraform = "true"
  }
}

data "aws_subnet_ids" "default" {
  vpc_id = aws_vpc.default.id
}

data "aws_subnet" "default" {
  id = "subnet-79222154"
}

data "aws_availability_zone" "default" {
  name = "us-east-1b"
}

resource "aws_default_network_acl" "default" {
  default_network_acl_id = aws_vpc.default.default_network_acl_id
  subnet_ids             = data.aws_subnet_ids.default.ids

  ingress {
    rule_no    = 100
    action     = "allow"
    cidr_block = module.constants.cidr_block_all
    protocol   = module.constants.protocol_all
    from_port  = module.constants.port_all
    to_port    = module.constants.port_all
  }

  egress {
    rule_no    = 100
    action     = "allow"
    cidr_block = module.constants.cidr_block_all
    protocol   = module.constants.protocol_all
    from_port  = module.constants.port_all
    to_port    = module.constants.port_all
  }

  tags = {
    Name      = "default-acl"
    Terraform = "true"
  }
}

resource "aws_security_group" "bastion" {
  name        = "bastion-sg"
  description = "bastion host security group"
  vpc_id      = aws_vpc.default.id

  ingress {
    description = "Allow all SSH"
    from_port   = module.constants.ssh_port
    to_port     = module.constants.ssh_port
    protocol    = "tcp"
    cidr_blocks = [module.constants.cidr_block_all]
    ipv6_cidr_blocks = [module.constants.cidr_block_v6_all]
  }

  ingress {
    description = "Allow web for kibana"
    from_port   = module.constants.http_port
    to_port     = module.constants.http_port
    protocol    = "tcp"
    cidr_blocks = [module.constants.cidr_block_all]
    ipv6_cidr_blocks = [module.constants.cidr_block_v6_all]
  }

  egress {
    description = "Allow all outbound"
    cidr_blocks = [module.constants.cidr_block_all]
    protocol    = module.constants.protocol_all
    from_port   = module.constants.port_all
    to_port     = module.constants.port_all
  }

  tags = {
    Name      = "bastion-instance-sg"
    Terraform = "true"
  }
}

resource "aws_lb" "default_private" {
  name               = "default-private-lb"
  internal           = true
  load_balancer_type = "application"

  // Recommended rules: https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-update-security-groups.html
  security_groups = [aws_security_group.default_private_lb.id]
  subnets         = data.aws_subnet_ids.default.ids

  //  subnet_mapping {
  //    subnet_id = "${var.subnet_id}"
  //    allocation_id = "${module.kibana.aws_eip_id}"
  //  }

  tags = {
    Name      = "default-private-lb"
    Terraform = "true"
  }
}

resource "aws_security_group" "default_private_lb" {
  name        = "default-private-lb-sg"
  description = "default private load balancer security group"
  vpc_id      = aws_vpc.default.id

  egress {
    cidr_blocks = [aws_vpc.default.cidr_block]
    protocol    = module.constants.protocol_all
    from_port   = module.constants.port_all
    to_port     = module.constants.port_all
  }

  tags = {
    Name      = "default-private-lb-sg"
    Terraform = "true"
  }
}

resource "aws_default_security_group" "default" {
  vpc_id = aws_vpc.default.id

  ingress {
    self      = true
    protocol  = module.constants.protocol_all
    from_port = module.constants.port_all
    to_port   = module.constants.port_all
  }

  egress {
    cidr_blocks = [module.constants.cidr_block_all]
    protocol    = module.constants.protocol_all
    from_port   = module.constants.port_all
    to_port     = module.constants.port_all
  }

  tags = {
    Name = "default-vpc-default-sg"
  }
}

data "aws_route53_zone" "howdju" {
  name = "howdju.com."
}
