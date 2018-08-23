[
  {
    "name": "kibana",
    "image": "${aws_account_id}.dkr.ecr.${aws_region}.amazonaws.com/${repository_name}:${container_version}",
    "portMappings": [
      {
        "containerPort": ${port},
        "hostPort": ${port}
      }
    ],
    "healthCheck": [ "CMD-SHELL", "curl -f http://localhost:${port}/ || exit 1" ],
    "logConfiguration": {
       "logDriver": "awslogs",
       "options": {
          "awslogs-group" : "${log_group}",
          "awslogs-region": "${aws_region}",
          "awslogs-stream-prefix": "${log_stream_prefix}"
    }
  }
]