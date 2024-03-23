variable "aws_region" {
  default = "us-east-1"
}

variable "key_name" {
  default = "premiser"
}

variable "base_domain" {
  default = "howdju.com"
}

## Elasticstack

variable "elasticstack_instance_type" {
  default = "m5.large"
}

variable "elasticsearch_data_owner" {
  default = "1000:1000"
}

variable "elasticsearch_container_version" {
  default = "1.2"
}

variable "elasticsearch_task_desired_count" {
  default = 1
}

// valid cpu/memory combinations: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-cpu-memory-error.html
variable "elasticsearch_task_cpu" {
  default = 512
}

variable "elasticsearch_task_memory_mib" {
  default = 4096
}

// must match path.data in elasticsearch.yml
variable "elasticsearch_data_path" {
  default = "/data/elasticsearch"
}

variable "elasticsearch_log_group" {
  default = "/ecs/elasticsearch"
}

variable "kibana_container_version" {
  default = "1.0"
}

variable "kibana_task_cpu" {
  default = 256
}

variable "kibana_task_memory_mib" {
  default = 512
}

variable "kibana_log_group" {
  default = "/ecs/kibana"
}

variable "lambdas_s3_noncurrent_version_expiration_days" {
  default = 10
}

variable "cloudwatch_to_elasticsearch_lambda_timeout" {
  default = 5
}

variable "cloudwatch_logs_elasticsearch_index" {
  default = "logs"
}

variable "cloudwatch_logs_elasticsearch_type" {
  default = "log_record"
}

variable "cloudwatch_to_elasticsearch_elasticsearch_timeout" {
  default = "3s"
}

variable "cloudwatch_to_elasticsearch_lambda_s3_key" {
  default = "CloudwatchLogsToElasticsearch/CloudwatchLogsToElasticsearch.zip"
}

variable "cloudwatch_to_elasticsearch_lambda_live_version" {
  default = 1
}

variable "elasticsearch_snapshots_lambda_timeout" {
  default = 5
}

variable "elasticsearch_snapshots_lambda_s3_key" {
  default = "ElasticsearchSnapshot/ElasticsearchSnapshot.zip"
}

variable "elasticsearch_repository_s3_bucket" {
  default = "howdju-elasticsearch-snapshots"
}

variable "elasticsearch_snapshots_lambda_log_level" {
  default = "debug"
}

variable "elasticsearch_snapshots_lambda_live_version" {
  default = 6
}

// The AWS provider default_tags cannot apply to autoscaling groups
// (https://www.hashicorp.com/blog/default-tags-in-the-terraform-aws-provider)
// So we store them here, too.
variable "default_tags" {
  default = {
    Terraform = "true"
  }
  description = "Default Tags for all Terraform-managed AWS resources"
  type        = map(string)
}
