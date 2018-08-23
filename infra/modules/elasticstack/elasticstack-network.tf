

// handled by services because only they know about ephemeral ports
//resource "aws_lb_target_group_attachment" "elasticsearch" {
//  target_group_arn = "${aws_lb_target_group.elasticsearch.arn}"
//  target_id = "${aws_instance.elasticstack.id}"
//  port = "${var.elasticsearch_port}"
//}

//resource "aws_vpc" "elasticstack" {
//  cidr_block = "10.0.0.0/16"
//  tags {
//    Name = "elasticstack-vpc"
//    Terraform = "true"
//  }
//}
//
//resource "aws_vpc_peering_connection" "elasticstack" {
//  peer_vpc_id = "${aws_vpc.elasticstack.id}"
//  vpc_id = "${var.bastion_vpc_id}"
//  auto_accept = true
//
//  tags {
//    Name = "vpc-peer-default-to-elasticstack"
//  }
//}

//resource "aws_default_security_group" "elasticstack" {
//  vpc_id = "${aws_vpc.elasticstack.id}"
//
//  ingress {
//    description = "allow all"
//    self = true
//    protocol = -1
//    from_port = 0
//    to_port = 0
//  }
//
//  egress {
//    description = "allow all"
//    cidr_blocks = ["0.0.0.0/0"]
//    protocol    = "-1"
//    from_port   = 0
//    to_port     = 0
//  }
//}
//
//resource "aws_default_network_acl" "elasticstack" {
//  default_network_acl_id = "${aws_vpc.elasticstack.default_network_acl_id}"
//  subnet_ids = ["${aws_subnet.elasticstack.*.id}"]
//
//  ingress {
//    rule_no    = 10
//    action     = "allow"
//    cidr_block = "0.0.0.0/0"
//    protocol   = "icmp"
//    icmp_type = 8
//    icmp_code = 0
//    from_port  = 0
//    to_port    = 0
//  }
//
//  ingress {
//    rule_no    = 100
//    action     = "allow"
//    cidr_block = "0.0.0.0/0"
//    protocol   = "tcp"
//    from_port  = "${var.ssh_port}"
//    to_port    = "${var.ssh_port}"
//  }
//
//  ingress {
//    rule_no    = 110
//    action     = "allow"
//    cidr_block = "0.0.0.0/0"
//    protocol   = "tcp"
//    from_port  = "${var.elasticsearch_port}"
//    to_port    = "${var.elasticsearch_port}"
//  }
//
//  ingress {
//    rule_no    = 120
//    action     = "allow"
//    cidr_block = "0.0.0.0/0"
//    protocol   = "tcp"
//    from_port  = "${var.kibana_port}"
//    to_port    = "${var.kibana_port}"
//  }
//
//  egress {
//    rule_no    = 100
//    action     = "allow"
//    cidr_block = "0.0.0.0/0"
//    protocol   = "-1"
//    from_port  = 0
//    to_port    = 0
//  }
//
//  tags {
//    Name = "elasticstack-default-acl"
//    Terraform = "true"
//  }
//}

//resource "aws_default_route_table" "elasticstack" {
//  default_route_table_id = "${aws_vpc.elasticstack.default_route_table_id}"
//
//  route {
//    cidr_block = "0.0.0.0/0"
//    gateway_id = "${aws_internet_gateway.elasticstack.id}"
//  }
//
//  route {
//    cidr_block = "172.31.0.0/16"
//    vpc_peering_connection_id = "${aws_vpc_peering_connection.elasticstack.id}"
//  }
//
//  tags {
//    Name = "elasticstack-default-rtb"
//  }
//}
//
//resource "aws_subnet" "elasticstack" {
//  count = "${length(data.aws_availability_zones.available.names)}"
//  vpc_id = "${aws_vpc.elasticstack.id}"
//  availability_zone = "${data.aws_availability_zones.available.names[count.index]}"
//  cidr_block = "${cidrsubnet(aws_vpc.elasticstack.cidr_block, 3, count.index)}"
//  depends_on = ["aws_internet_gateway.elasticstack"]
//}
