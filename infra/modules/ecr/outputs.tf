output "elasticsearch_repository_name" {
  value = aws_ecr_repository.elasticsearch.name
}

output "kibana_repository_name" {
  value = aws_ecr_repository.kibana.name
}

