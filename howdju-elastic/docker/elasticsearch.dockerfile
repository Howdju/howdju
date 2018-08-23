FROM docker.elastic.co/elasticsearch/elasticsearch:6.3.2

# https://www.elastic.co/guide/en/elasticsearch/reference/6.3/docker.html
# https://www.elastic.co/guide/en/elasticsearch/reference/current/settings.html

ENV AWS_REGION us-east-1
ADD elasticsearch.yml /usr/share/elasticsearch/config/
USER root
RUN chown elasticsearch:elasticsearch /usr/share/elasticsearch/config/elasticsearch.yml
# https://www.elastic.co/guide/en/elasticsearch/reference/current/system-config.html
# TODO: https://www.elastic.co/guide/en/elasticsearch/reference/current/networkaddress-cache-ttl.html
#RUN sysctl -w vm.swappiness=1 && \
#  sysctl -w vm.max_map_count=262144
USER elasticsearch
WORKDIR /usr/share/elasticsearch
RUN bin/elasticsearch-plugin install -b discovery-ec2 && \
  # TODO: https://www.elastic.co/guide/en/elasticsearch/plugins/current/repository-s3.html
  # bin/elasticsearch-plugin install repository-s3 && \
  # mkdir -p /usr/share/elasticsearch/data/ && \
  # chown -R 1000.1000 /usr/share/elasticsearch/data/ && \
  # chown -R elasticsearch:elasticsearch /usr/share/elasticsearch/data/ && \
  sed -e '/^-Xm/s/^/#/g' -i /usr/share/elasticsearch/config/jvm.options