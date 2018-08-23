FROM docker.elastic.co/logstash/logstash:6.3.2

RUN bin/logstash-plugin install logstash-input-cloudwatch

