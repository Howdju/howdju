FROM docker.elastic.co/kibana/kibana:6.3.2

ADD kibana.yml /usr/share/kibana/config/
