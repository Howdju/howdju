FROM docker.elastic.co/kibana/kibana:6.4.0

ADD kibana.yml /usr/share/kibana/config/
