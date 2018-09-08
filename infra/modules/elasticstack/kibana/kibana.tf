variable "container_name" {default = "kibana"}
variable "container_port" {default = 5601}

module "constants" {
  source = "../../constants"
}

resource "aws_ecs_service" "kibana" {
  name = "kibana"
  cluster = "${var.ecs_cluster_id}"
  task_definition = "${aws_ecs_task_definition.kibana.arn}"
  desired_count = "${var.task_desired_count}"
  // kibana takes a long time to become responsive, so ignore the ELB's unhealthy health check for some time
  health_check_grace_period_seconds = 300

  load_balancer {
    target_group_arn = "${aws_lb_target_group.kibana.arn}"
    container_name = "${var.container_name}"
    container_port = "${var.container_port}"
  }

  iam_role = "${aws_iam_role.kibana_service.arn}"
  // We use a managed policy, not a role policy, and it's built-in, so I don't know if we need this depends on relation.
  depends_on = ["data.aws_iam_policy.AmazonEC2ContainerServiceRole"]
}

resource "aws_iam_role" "kibana_service" {
  name = "kibana_service_role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "",
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
}

// https://docs.aws.amazon.com/AmazonECS/latest/developerguide/service_IAM_role.html
data "aws_iam_policy" "AmazonEC2ContainerServiceRole" {
  arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceRole"
}

resource "aws_iam_role_policy_attachment" "AmazonEC2ContainerServiceRole" {
  role = "${aws_iam_role.kibana_service.name}"
  policy_arn = "${data.aws_iam_policy.AmazonEC2ContainerServiceRole.arn}"
}

resource "aws_ecs_task_definition" "kibana" {
  family = "kibana"
  container_definitions = "${data.template_file.kibana_container_definitions.rendered}"
  network_mode = "bridge"
  cpu = "${var.task_cpu}"
  memory = "${var.task_memory_mib}"
  task_role_arn = "${aws_iam_role.kibana_task.arn}"
}

resource "aws_iam_role" "kibana_task" {
  name = "kibana_task_role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "",
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
}

data "template_file" "kibana_container_definitions" {
  template = "${file("${path.module}/kibana_container_definitions.tpl.json")}"

  vars {
    container_name = "${var.container_name}"
    aws_account_id = "${var.aws_account_id}"
    aws_region = "${var.aws_region}"
    repository_name = "${var.repository_name}"
    container_version = "${var.container_version}"
    elasticsearch_url = "${var.elasticsearch_url}"
    port = "${var.container_port}"
    host_port = "${module.constants.ecs_ephemeral_host_port}"
    health_check_grace_period_seconds = 120
    log_group = "/ecs/kibana"
    log_stream_prefix = "ecs"
  }
}

resource "aws_cloudwatch_log_group" "kibana" {
  name = "${var.log_group}"
  retention_in_days = 90
}

resource "aws_security_group_rule" "lb" {
  security_group_id = "${var.lb_security_group_id}"
  description = "allow kibana"
  type = "ingress"
  cidr_blocks = ["${var.lb_ingress_cidr}"]
  protocol = "tcp"
  from_port = "${var.lb_port}"
  to_port = "${var.lb_port}"
}

resource "aws_lb_target_group" "kibana" {
  name = "kibana-lb-tg"
  vpc_id = "${var.vpc_id}"
  protocol = "HTTP"
  // "The port on which targets receive traffic, unless overridden when registering a specific target."
  // I think that the service will override with an ephemeral port when it registers containers
  port = "${module.constants.kibana_port}"
  target_type = "instance"
  // These should be the defaults.  We want to check the health fairly frequently, although kibana takes
  //  a while to become responsive initially , so we will ignore the unhealthy status for a while
  health_check {
    interval = 30
    path = "/"
    port = "traffic-port"
    protocol = "HTTP"
    timeout = 5
    healthy_threshold = 3
    unhealthy_threshold = 3
    matcher = "200"
  }
}

resource "aws_lb_listener" "kibana" {
  load_balancer_arn = "${var.lb_arn}"
  protocol = "HTTP"
  port = "${var.lb_port}"

  default_action {
    target_group_arn = "${aws_lb_target_group.kibana.arn}"
    type = "forward"
  }
}
