#!/bin/bash

# Mount EBS data volume
#mkfs -t ext4 ${data_device_name}
#mkdir ${data_mount_path}
#mount ${data_device_name} ${data_mount_path}
#mkdir ${data_directory}
#chown ${data_owner} ${data_directory}
#echo ${data_device_name} ${data_mount_path} ext4 defaults,nofail 0 2 >> /etc/fstab
#service docker restart

# ES has min vm.max_map_count requirements
# https://www.elastic.co/guide/en/elasticsearch/reference/current/vm-max-map-count.html
sysctl -w vm.max_map_count=262144
sed -ir 's/#{1,}?vm.max_map_count\s*=\s*[0-9]+/vm.max_map_count = 262144/g' /etc/sysctl.conf

# Configure ECS Container Agent
# https://docs.aws.amazon.com/AmazonECS/latest/developerguide/launch_container_instance.html
# https://docs.aws.amazon.com/AmazonECS/latest/developerguide/bootstrap_container_instance.html
cat <<'EOF' >> /etc/ecs/ecs.config
ECS_CLUSTER=${cluster_name}
ECS_LOGLEVEL=debug
EOF
