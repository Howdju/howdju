// A NAT instance replacing the (much more expensive) managed NAT gateway. It gives the Lambdas in
// the private subnet outbound internet access (SSM, SNS, SES, and fetching pages for the URL
// locator auto-confirmation.) It is sized so that it can also host Postgres later.

locals {
  nat_instance_type = "t4g.micro"
  // Pinned so that plans don't want to replace the instance whenever Amazon publishes a new AMI.
  // al2023-ami-2023.12.20261112.0-kernel-6.12-arm64
  nat_instance_ami = "ami-0ab35800c7c9977a5"
}

resource "aws_instance" "nat" {
  ami                         = local.nat_instance_ami
  instance_type               = local.nat_instance_type
  subnet_id                   = data.aws_subnet.default_public_subnet_a.id
  associate_public_ip_address = true
  // Required for the instance to forward traffic that isn't addressed to itself.
  source_dest_check      = false
  vpc_security_group_ids = [aws_security_group.nat.id]
  iam_instance_profile   = aws_iam_instance_profile.nat.name
  user_data              = file("${path.module}/nat_user_data.sh")

  metadata_options {
    http_tokens = "required"
  }

  root_block_device {
    volume_type = "gp3"
    volume_size = 8
  }

  tags = {
    Name = "nat"
  }
}

resource "aws_security_group" "nat" {
  name        = "nat-instance"
  description = "NAT instance: accept traffic from the VPC and forward it to the internet"
  vpc_id      = aws_vpc.default.id

  ingress {
    description = "Allow all traffic from within the VPC"
    protocol    = module.constants.protocol_all
    cidr_blocks = [aws_vpc.default.cidr_block]
    from_port   = module.constants.port_all
    to_port     = module.constants.port_all
  }

  egress {
    description = "Allow all outbound"
    protocol    = module.constants.protocol_all
    cidr_blocks = [module.constants.cidr_block_ipv4_all]
    from_port   = module.constants.port_all
    to_port     = module.constants.port_all
  }

  tags = {
    Name = "nat-instance-sg"
  }
}

// Allows administering the instance through SSM Session Manager without SSH or a bastion.
resource "aws_iam_role" "nat" {
  name = "nat-instance"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "nat_ssm" {
  role       = aws_iam_role.nat.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "nat" {
  name = "nat-instance"
  role = aws_iam_role.nat.name
}

// The Lambdas lose internet access if the instance's host fails, so have EC2 automatically
// recover it onto healthy hardware (keeping its ID, private IP, and ENI, so the route stays valid.)
resource "aws_cloudwatch_metric_alarm" "nat_auto_recover" {
  alarm_name          = "nat-instance-auto-recover"
  namespace           = "AWS/EC2"
  metric_name         = "StatusCheckFailed_System"
  statistic           = "Maximum"
  period              = 60
  evaluation_periods  = 2
  comparison_operator = "GreaterThanThreshold"
  threshold           = 0
  dimensions = {
    InstanceId = aws_instance.nat.id
  }
  alarm_actions = ["arn:aws:automate:${var.aws_region}:ec2:recover"]
}

// The private subnet's route table was created outside of Terraform; we only manage its default
// route. To roll back to the NAT gateway, point this at nat_gateway_id = "nat-0c59d73a4fedca319"
// (until that gateway is deleted.)
import {
  to = aws_route.private_default
  id = "rtb-0d1c379cc22407fd2_0.0.0.0/0"
}

resource "aws_route" "private_default" {
  route_table_id         = "rtb-0d1c379cc22407fd2"
  destination_cidr_block = module.constants.cidr_block_ipv4_all
  network_interface_id   = aws_instance.nat.primary_network_interface_id
}
