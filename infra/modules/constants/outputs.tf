output "ssh_port" {value = "22"}
output "http_port" {value = "80"}
output "elasticsearch_port" {value = "9200"}
output "elasticsearch_transport_port" {value = "9300"}
output "kibana_port" {value = "5601"}
output "ecs_ephemeral_host_port" {value = "0"}
output "ping_icmp_type_number" {value = "8"}
output "ping_icmp_code" {value = "0"}
output "protocol_all" {value = "-1"}
output "port_all" {value = "0"}
output "cidr_block_all" {value = "0.0.0.0/0"}
output "cidr_block_v6_all" {value = "::/0"}

// "The default ephemeral port range for Docker version 1.6.0 and later is listed on the instance under /proc/sys/net/ipv4/ip_local_port_range;
// if this kernel parameter is unavailable, the default ephemeral port range from 49153 through 65535 is used."
// https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_PortMapping.html
// This is what was in this file for: amzn-ami-2018.03.e-amazon-ecs-optimized (ami-00129b193dc81bc31)
output "ephemeral_min_port" {value = "32768"}
output "ephemeral_max_port" {value = "60999"}
