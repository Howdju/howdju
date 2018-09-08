output "elasticstack_private_ip" {
  value = "${aws_instance.elasticstack.private_ip}"
}

//output "kibana_host" {
//  value = "${aws_route53_record.kibana.name}"
//}

output "instance_id" {
  value = "${aws_instance.elasticstack.id}"
}

output "elasticsearch_lb_authority" {
  value = "${var.lb_dns_name}:${var.elasticsearch_lb_port}"
}
