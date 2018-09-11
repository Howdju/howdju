#!/bin/bash

ensure_data_volume() {
  if ! $(df | grep -q ${data_mount_path}); then
    create_data_volume
  fi
}

create_data_volume() {
  mkfs -t ext4 ${data_device_name}
  mkdir ${data_mount_path}
  mount ${data_device_name} ${data_mount_path}
  mkdir ${data_directory}
  chown ${data_owner} ${data_directory}
  echo ${data_device_name} ${data_mount_path} ext4 defaults,nofail 0 2 >> /etc/fstab
  service docker restart
}

configure_for_elasticsearch() {
  # https://www.elastic.co/guide/en/elasticsearch/reference/current/system-config.html

  # ES has min vm.max_map_count requirements
  # https://www.elastic.co/guide/en/elasticsearch/reference/current/vm-max-map-count.html
  sysctl -w vm.max_map_count=262144
  sed -ir 's/#{1,}?vm.max_map_count\s*=\s*[0-9]+/vm.max_map_count = 262144/g' /etc/sysctl.conf

  # For best performance, ES should have a minimum of swappiness.
  # But since the instance is shared with non-ES tasks, we might not want to set this for now.
  # sysctl -w vm.swappiness=1
}

configure_ecs_container_agent() {
  # https://docs.aws.amazon.com/AmazonECS/latest/developerguide/launch_container_instance.html
  # https://docs.aws.amazon.com/AmazonECS/latest/developerguide/bootstrap_container_instance.html
  cat <<'EOF' >> /etc/ecs/ecs.config
ECS_CLUSTER=${cluster_name}
ECS_LOGLEVEL=debug
EOF
}

yum update -y
ensure_data_volume
configure_for_elasticsearch
configure_ecs_container_agent
