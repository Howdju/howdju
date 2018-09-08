variable "aws_region" {default = "us-east-1" }
variable "key_name" {default = "premiser"}
variable "base_domain" {default = "howdju.com"}
variable "elasticsearch_task_desired_count" {default = 1}
variable "elasticstack_instance_type" {default = "m5.large"}
variable "elasticsearch_container_version" {default = "1.0"}
// valid cpu/memory combinations: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-cpu-memory-error.html
variable "elasticsearch_task_cpu" {default = 512}
variable "elasticsearch_task_memory_mib" {default = 4096}
variable "elasticsearch_log_group" {default = "/ecs/elasticsearch"}
variable "kibana_container_version" {default = "1.0"}
variable "kibana_task_cpu" {default = 256}
variable "kibana_task_memory_mib" {default = 512}
variable "kibana_log_group" {default = "/ecs/kibana"}
