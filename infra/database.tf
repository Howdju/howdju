resource "aws_security_group" "rds_launch_wizard" {
  description = "Created from the RDS Management Console"
  egress = [{
    cidr_blocks      = ["0.0.0.0/0"]
    description      = ""
    from_port        = 0
    prefix_list_ids  = []
    security_groups  = []
    ipv6_cidr_blocks = ["::/0"]
    protocol         = "-1"
    self             = false
    to_port          = 0
  }]
  ingress = [{
    cidr_blocks      = ["172.31.0.0/16"]
    description      = ""
    from_port        = 5432
    ipv6_cidr_blocks = []
    prefix_list_ids  = []
    security_groups  = []
    protocol         = "tcp"
    self             = false
    to_port          = 5432
  }]
  name = "rds-launch-wizard-1"
  tags = {
    Name = "RDS security group"
  }
  vpc_id = "vpc-dfd3f6b9"
  lifecycle {
    ignore_changes = [tags_all, revoke_rules_on_delete]
  }
}

resource "aws_db_instance" "premiser" {
  allocated_storage                     = 20
  auto_minor_version_upgrade            = true
  availability_zone                     = "us-east-1b"
  backup_retention_period               = 7
  backup_target                         = "region"
  backup_window                         = "08:09-08:39"
  ca_cert_identifier                    = "rds-ca-rsa2048-g1"
  copy_tags_to_snapshot                 = false
  customer_owned_ip_enabled             = false
  database_insights_mode                = "standard"
  db_name                               = "premiser"
  db_subnet_group_name                  = "default"
  dedicated_log_volume                  = false
  delete_automated_backups              = true
  deletion_protection                   = false
  enabled_cloudwatch_logs_exports       = ["postgresql", "upgrade"]
  engine                                = "postgres"
  engine_lifecycle_support              = "open-source-rds-extended-support"
  engine_version                        = "16.13"
  iam_database_authentication_enabled   = false
  identifier                            = "premiser"
  instance_class                        = "db.t4g.micro"
  iops                                  = 3000
  license_model                         = "postgresql-license"
  maintenance_window                    = "sun:06:36-sun:07:06"
  max_allocated_storage                 = 0
  monitoring_interval                   = 0
  multi_az                              = false
  network_type                          = "IPV4"
  option_group_name                     = "default:postgres-16"
  parameter_group_name                  = "default.postgres16"
  performance_insights_enabled          = true
  performance_insights_kms_key_id       = "arn:aws:kms:us-east-1:007899441171:key/44d9929e-d4cf-47ca-9a6e-1f54ba7101fd"
  performance_insights_retention_period = 7
  port                                  = 5432
  publicly_accessible                   = false
  skip_final_snapshot                   = true
  storage_encrypted                     = false
  storage_throughput                    = 125
  storage_type                          = "gp3"
  tags = {
    workload-type = "other"
  }
  username               = "premiser_rds"
  vpc_security_group_ids = [module.bastion_connect.db_instances_security_group.id, aws_security_group.rds_launch_wizard.id]
  lifecycle {
    prevent_destroy = true
    ignore_changes  = [password, tags_all, apply_immediately]
  }
}
