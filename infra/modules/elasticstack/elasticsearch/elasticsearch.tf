// https://aws.amazon.com/premiumsupport/knowledge-center/assume-role-validate-listeners/

variable "container_name" {default = "elasticsearch"}
variable "container_port" {default = 9200}
variable "container_transport_port" {default = 9300}
variable "data_volume_name" {default = "elasticsearch-data"}

module "constants" {
  source = "../../constants"
}

resource "aws_ecs_service" "elasticsearch" {
  name = "elasticsearch"
  cluster = "${var.ecs_cluster_id}"
  task_definition = "${aws_ecs_task_definition.elasticsearch.arn}"
  desired_count = "${var.task_desired_count}"
  health_check_grace_period_seconds = 300

  load_balancer {
    target_group_arn = "${aws_lb_target_group.elasticsearch.arn}"
    container_name = "${var.container_name}"
    container_port = "${var.container_port}"
  }

  iam_role = "${aws_iam_role.elasticsearch_service.arn}"

  placement_constraints {
    // To use a named docker volume, each task must be on a different instance
    type = "distinctInstance"
  }

  // We use a managed policy, not a role policy, and it's built-in, so I don't know if we need this depends on relation.
  depends_on = ["data.aws_iam_policy.AmazonEC2ContainerServiceRole"]
}

resource "aws_iam_role" "elasticsearch_service" {
  name = "elasticsearch_service_role"

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
  role = "${aws_iam_role.elasticsearch_service.name}"
  policy_arn = "${data.aws_iam_policy.AmazonEC2ContainerServiceRole.arn}"
}

//variable "data_volume_name" {default = "data"}

resource "aws_ecs_task_definition" "elasticsearch" {
  family = "elasticsearch"
  container_definitions = "${data.template_file.elasticsearch_container_definitions.rendered}"
  network_mode = "bridge"
  cpu = "${var.task_cpu}"
  memory = "${var.task_memory_mib}"
  task_role_arn = "${aws_iam_role.elasticsearch_task.arn}"
  volume {
    name = "${var.data_volume_name}"
    host_path = "${var.host_data_directory}"
  }
}

resource "aws_iam_role" "elasticsearch_task" {
  name = "elasticsearch_task_role"

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

resource "aws_iam_role_policy_attachment" "elasticsearch_ec2_discovery" {
  role = "${aws_iam_role.elasticsearch_task.name}"
  policy_arn = "${aws_iam_policy.elasticsearch_discovery_ec2_plugin.arn}"
}

resource "aws_iam_policy" "elasticsearch_discovery_ec2_plugin" {
  name = "elasticsearch_discovery_ec2_plugin"
  description = "Enables the discovery-ec2 plugin"
  policy = <<EOF
{
  "Statement": [
    {
      "Action": [
        "ec2:DescribeInstances"
      ],
      "Effect": "Allow",
      "Resource": [
        "*"
      ]
    }
  ],
  "Version": "2012-10-17"
}
EOF
}

// Elasticsearch must be configured with this user's setting using its keystore (currently in the dockerfile)
resource "aws_iam_user" "elasticsearch_s3_snapshots" {
  name = "elasticsearch_s3_snapshots_user"
}

resource "aws_iam_user_policy_attachment" "elasticsearch_s3_snapshots" {
  user = "${aws_iam_user.elasticsearch_s3_snapshots.name}"
  policy_arn = "${aws_iam_policy.elasticsearch_s3_snapshots.arn}"
}

resource "aws_iam_policy" "elasticsearch_s3_snapshots" {
  name = "elasticsearch_s3_snapshots_policy"
  description = "Enables writing to the Elasticsearch S3 snapshots bucket"
  policy = "${data.aws_iam_policy_document.elasticsearch_s3_snapshots.json}"
}

data "aws_iam_policy_document" "elasticsearch_s3_snapshots" {
  statement {
    actions = [
      "s3:ListBucket",
      "s3:GetBucketLocation",
      "s3:ListBucketMultipartUploads",
      "s3:ListBucketVersions"
    ]
    resources = ["arn:aws:s3:::${aws_s3_bucket.snapshots.bucket}"]
  }
  statement {
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:AbortMultipartUpload",
      "s3:ListMultipartUploadParts"
    ]
    resources = ["arn:aws:s3:::${aws_s3_bucket.snapshots.bucket}/*"]
  }
}

resource "aws_s3_bucket" "snapshots" {
  bucket = "howdju-elasticsearch-snapshots"
}

// For debugging template rendering:
// terraform plan -target=module.elasticstack.module.elasticsearch.null_resource.test_template
//resource "null_resource" "test_template" {
//  triggers = {
//    json = "${data.template_file.elasticsearch_container_definitions.rendered}"
//  }
//}

data "template_file" "elasticsearch_container_definitions" {
  template = "${file("${path.module}/elasticsearch_container_definitions.tpl.json")}"

  vars {
    container_name = "${var.container_name}"
    aws_account_id = "${var.aws_account_id}"
    aws_region = "${var.aws_region}"
    repository_name = "${var.repository_name}"
    container_version = "${var.container_version}"

    // Use this command_override instead to get debug logging
    // command_override = "\"command\": [\"elasticsearch\", \"-Elogger.level=debug\"]",
    command_override = "",

    // Elasticsearch recommends using no more than half of the available memory for the task, so that the rest can be
    // memory mapped to shards/indices.
    memory_mib = "${var.task_memory_mib / 2}"

    memlock_limit = "${var.task_memory_mib * 1024}"
    port = "${var.container_port}"
    host_port = "${module.constants.ecs_ephemeral_host_port}"
    transport_port = "${var.container_transport_port}"
    host_transport_port = "${module.constants.ecs_ephemeral_host_port}"

    data_volume_name = "${var.data_volume_name}"
    data_volume_container_path = "${var.elasticsearch_data_path}"

    log_group = "/ecs/elasticsearch"
    log_stream_prefix = "ecs"
  }
}

resource "aws_cloudwatch_log_group" "elasticsearch" {
  name = "${var.log_group}"
  retention_in_days = 90
}

resource "aws_security_group_rule" "lb" {
  security_group_id = "${var.lb_security_group_id}"
  description = "allow elasticsearch"
  type = "ingress"
  cidr_blocks = ["${var.lb_ingress_cidr}"]
  protocol = "tcp"
  from_port = "${var.lb_port}"
  to_port = "${var.lb_port}"
}

resource "aws_lb_target_group" "elasticsearch" {
  name = "elasticsearch-lb-tg"
  vpc_id = "${var.vpc_id}"
  protocol = "HTTP"
  // "The port on which targets receive traffic, unless overridden when registering a specific target."
  // I think that the service will override with an ephemeral port when it registers containers
  port = "${module.constants.elasticsearch_port}"
  target_type = "instance"
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

resource "aws_lb_listener" "elasticsearch" {
  load_balancer_arn = "${var.lb_arn}"
  protocol = "HTTP"
  port = "${var.lb_port}"

  default_action {
    target_group_arn = "${aws_lb_target_group.elasticsearch.arn}"
    type = "forward"
  }
}