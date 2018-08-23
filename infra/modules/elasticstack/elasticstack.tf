variable "elasticstack_data_device_name" {default="/dev/sdf"}
variable "elasticstack_data_mount_path" {default="/data/"}
variable "elasticstack_data_directory" {default="/data/elasticsearch/"}
variable "elasticsearch_data_owner" {default="1000:1000"}

module "constants" {
  source = "../constants/"
}

resource "aws_ecs_cluster" "elasticstack" {
  name = "elasticstack"
}

module "elasticsearch" {
  source = "./elasticsearch"
  aws_account_id = "${var.aws_account_id}"
  aws_region = "${var.aws_region}"
  ecs_cluster_id = "${aws_ecs_cluster.elasticstack.id}"
  task_desired_count = "${var.elasticsearch_task_desired_count}"
  repository_name = "${var.elasticsearch_repository_name}"
  container_version = "${var.elasticsearch_container_version}"
  task_cpu = "${var.elasticsearch_task_cpu}"
  task_memory_mib = "${var.elasticsearch_task_memory_mib}"
  log_group = "${var.elasticsearch_log_group}"
//  subnet_id = "${var.subnet_id}"
//  task_security_group_ids = ["${aws_security_group.elasticsearch_task.id}"]
  vpc_id = "${var.vpc_id}"
  lb_arn = "${var.lb_arn}"
  lb_port = "${var.elasticsearch_lb_port}"
  lb_security_group_id = "${var.lb_security_group_id}"
  elasticsearch_ingress_cidr = "${var.elasticsearch_ingress_cidr}"
}

//module "kibana" {
//  eip_subnet_id = "${aws_subnet.elasticstack.0.id}"
//  task_security_group_ids = ["${aws_security_group.kibana_task.id}"]
//}

resource "aws_instance" "elasticstack" {
  ami = "${data.aws_ami.elasticstack.id}"
  instance_type = "${var.instance_type}"
  subnet_id = "${var.instance_subnet_id}"
  vpc_security_group_ids = ["${aws_security_group.elasticstack_instance.id}"]
  ebs_optimized = true
  key_name = "${var.key_name}"
  user_data = "${data.template_file.elasticstack_user_data.rendered}"
  iam_instance_profile = "${aws_iam_instance_profile.elasticstack.name}"
  tags {
    Name = "elasticstack"
    ElasticSearchDiscovery = "elasticstack_esnode"
    Terraform = "true"
  }
}

resource "aws_iam_instance_profile" "elasticstack" {
  name = "elasticstack_instance_profile"
  role = "${aws_iam_role.elasticstack_instance.name}"
}

resource "aws_iam_role" "elasticstack_instance" {
  name = "elasticstack_instance_role"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "",
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "AmazonEC2ContainerServiceforEC2Role" {
  role = "${aws_iam_role.elasticstack_instance.name}"
  policy_arn = "${data.aws_iam_policy.AmazonEC2ContainerServiceforEC2Role.arn}"
}

// https://docs.aws.amazon.com/AmazonECS/latest/developerguide/instance_IAM_role.html
data "aws_iam_policy" "AmazonEC2ContainerServiceforEC2Role" {
  arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role"
}

data "template_file" "elasticstack_user_data" {
  template = "${file("${path.module}/elasticstack_user_data.tpl.sh")}"
  vars {
    data_device_name = "${var.elasticstack_data_device_name}"
    data_mount_path = "${var.elasticstack_data_mount_path}"
    data_owner = "${var.elasticsearch_data_owner}"
    data_directory = "${var.elasticstack_data_directory}"
    cluster_name = "${aws_ecs_cluster.elasticstack.name}"
  }
}

//resource "aws_ebs_volume" "elasticstack" {
//  availability_zone = "${var.volume_availability_zone_name}"
//  size = 32
//  type = "gp2"
//  tags {
//    Name = "elasticstack-ebs"
//    Terraform = "true"
//  }
//}

//resource "aws_volume_attachment" "elasticstack" {
//  // https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-ami-storage-config.html
//  device_name = "${var.elasticstack_data_device_name}"
//  volume_id = "${aws_ebs_volume.elasticstack.id}"
//  instance_id = "${aws_instance.elasticstack.id}"
//}

data "aws_ami" "elasticstack" {
  filter {
    name   = "owner-alias"
    values = ["amazon"]
  }
  name_regex = "^amzn-ami-\\d{4}\\.\\d{2}\\.[a-z]-amazon-ecs-optimized"
  most_recent = true
}

resource "aws_security_group" "elasticstack_instance" {
  name = "elasticstack-instance-sg"
  description = "elasticstack instance security group"
  vpc_id = "${var.vpc_id}"

  ingress {
    description = "allow SSH from bastion"
    security_groups = ["${var.bastion_security_group_id}"]
    protocol = "tcp"
    from_port = "${module.constants.ssh_port}"
    to_port = "${module.constants.ssh_port}"
  }

  ingress {
    description = "allow ping from bastion"
    security_groups = ["${var.bastion_security_group_id}"]
    protocol = "icmp"
    from_port = "${module.constants.ping_icmp_type_number}"
    to_port = "${module.constants.ping_icmp_code}"
  }

  ingress {
    description = "allow ephemeral ports from load balancer"
    security_groups = ["${var.lb_security_group_id}"]
    protocol = "tcp"
    from_port = "${module.constants.ephemeral_min_port}"
    to_port = "${module.constants.ephemeral_max_port}"
  }

  ingress {
    description = "allow elasticsearch transport from self"
    protocol = "tcp"
    from_port = "${module.constants.elasticsearch_transport_port}"
    to_port = "${module.constants.elasticsearch_transport_port}"
    self = true
  }

  egress {
    description = "allow all"
    cidr_blocks = ["${module.constants.cidr_block_all}"]
    protocol = "${module.constants.protocol_all}"
    from_port = "${module.constants.port_all}"
    to_port = "${module.constants.port_all}"
  }

  tags {
    Name = "elasticstack-instance-sg"
    Terraform = "true"
  }
}

//resource "aws_security_group" "elasticsearch_task" {
//  name        = "elasticsearch-task-sg"
//  description = "elasticsearch task security group"
//  vpc_id      = "${var.vpc_id}"
//
//  ingress {
//    description = "allow elasticsearch traffic from instance, or self"
//    security_groups = [
//      "${aws_security_group.elasticstack_instance.id}"
//    ]
//    protocol    = "tcp"
//    from_port   = "${var.elasticsearch_port}"
//    to_port     = "${var.elasticsearch_port}"
//    self = true
//  }
//
//  egress {
//    description = "allow all"
//    cidr_blocks = ["0.0.0.0/0"]
//    protocol = "-1"
//    from_port = 0
//    to_port = 0
//  }
//
//  tags {
//    Name = "elasticearch-task-sg"
//    Terraform = "true"
//  }
//}

//resource "aws_security_group" "kibana_task" {
//  name        = "kibana-task-sg"
//  description = "kibana task security group"
//  vpc_id      = "${var.vpc_id}"
//
//  ingress {
//    description = "allow kibana traffic from load balancer, instance, or self"
//    security_groups = [
//      "${aws_security_group.elasticstack_instance.id}"
//    ]
//    protocol = "tcp"
//    from_port = "${var.kibana_port}"
//    to_port = "${var.kibana_port}"
//    self = true
//  }
//
//  egress {
//    description = "allow all"
//    cidr_blocks = ["0.0.0.0/0"]
//    protocol = "-1"
//    from_port = 0
//    to_port = 0
//  }
//
//  tags {
//    Name = "kibana-task-sg"
//    Terraform = "true"
//  }
//}
