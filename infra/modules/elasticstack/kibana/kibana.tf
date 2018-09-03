

resource "aws_ecs_service" "kibana" {
  name = "kibana"
  cluster = "${var.ecs_cluster_id}"
  task_definition = "${aws_ecs_task_definition.kibana.arn}"
  desired_count = 1
  iam_role = "${aws_iam_role.kibana.arn}"
  depends_on = ["aws_iam_role_policy.kibana"]

  network_configuration {
    subnets = ["${var.subnets}"]
    security_groups = ["${var.task_security_group_ids}"]
  }

  load_balancer {
    target_group_arn = "${var.lb_target_group_arn}"
    container_name = "${var.container_name}"
    container_port = "${var.port}"
  }

  placement_constraints {
    type       = "memberOf"
    expression = "attribute:ecs.instance-id = ${var.instance_id}"
  }
}

resource "aws_iam_role" "kibana" {
  name = "kibana role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "ecs.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_role_policy" "kibana" {
  name = "kibana role policy"
  role = "${aws_iam_role.kibana.id}"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "AmazonEC2ContainerServiceRole" {
  role = "${aws_iam_role.kibana.name}"
  policy_arn = "${data.aws_iam_policy.AmazonEC2ContainerServiceRole.arn}"
}

// https://docs.aws.amazon.com/AmazonECS/latest/developerguide/service_IAM_role.html
data "aws_iam_policy" "AmazonEC2ContainerServiceRole" {
  arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceRole"
}

resource "aws_ecs_task_definition" "kibana" {
  family = "kibana"
  container_definitions = "${data.template_file.kibana_container_definitions.rendered}"
  network_mode = "awsvpc"
  cpu = 256
  memory = 512
}

data "template_file" "kibana_container_definitions" {
  template = "${file("${path.module}/kibana_service_task_definitions.tpl")}"

  vars {
    aws_account_id = "${var.aws_account_id}"
    aws_region = "${var.aws_region}"
    repository_name = "${var.repository_name}"
    container_version = "${var.container_version}"
    port = "${var.port}"
    log_group = "/ecs/kibana"
    log_stream_prefix = "ecs"
  }
}

resource "aws_eip" "kibana" {
  vpc = true
  subnet_id = "${var.eip_subnet_id}"
  depends_on = ["aws_internet_gateway.elasticstack"]
}


data "aws_route53_zone" "howdju" {
  name = "${var.base_domain}."
  private_zone = true
}

resource "aws_route53_record" "kibana" {
  zone_id = "${data.aws_route53_zone.howdju.zone_id}"
  name    = "kibana.${data.aws_route53_zone.howdju.name}"
  type    = "A"
  ttl     = "300"
  records = ["${aws_eip.kibana.public_ip}"]
}


resource "aws_security_group_rule" "lb" {
  security_group_id = "${var.lb_security_group}"
  description = "allow elasticsearch"
  type = "ingress"
  cidr_blocks = ["0.0.0.0/0"]
  protocol = "tcp"
  from_port = "${var.port}"
  to_port = "${var.port}"
}

resource "aws_lb_target_group" "kibana" {
  name = "kibana-lb-tg"
  vpc_id = "${aws_vpc.default.id}"
  protocol = "HTTP"
  port = "${module.constants.kibana_port}"
  target_type = "instance"
}
