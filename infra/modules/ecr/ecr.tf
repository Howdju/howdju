resource "aws_ecr_repository" "elasticsearch" {
  name = "howdju/elasticsearch"
}

resource "aws_ecr_repository" "kibana" {
  name = "howdju/kibana"
}

