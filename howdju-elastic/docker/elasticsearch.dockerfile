FROM docker.elastic.co/elasticsearch/elasticsearch:6.4.0

# https://www.elastic.co/guide/en/elasticsearch/reference/6.4/docker.html
# https://www.elastic.co/guide/en/elasticsearch/reference/current/settings.html

ENV AWS_REGION us-east-1

ARG S3_REPOSITORY_KEY_ID
ARG S3_REPOSITORY_SECRET_KEY

# TODO: for node discovery, we might need to let DNS lookups expire?
# https://www.elastic.co/guide/en/elasticsearch/reference/current/networkaddress-cache-ttl.html

RUN \
  bin/elasticsearch-plugin install -b discovery-ec2 --batch --verbose && \
  # TODO: https://www.elastic.co/guide/en/elasticsearch/plugins/current/repository-s3.html
  bin/elasticsearch-plugin install repository-s3 --batch --verbose && \
  bin/elasticsearch-keystore create && \
  echo "$S3_REPOSITORY_KEY_ID" | bin/elasticsearch-keystore add --stdin s3.client.default.access_key && \
  echo "$S3_REPOSITORY_SECRET_KEY" | bin/elasticsearch-keystore add --stdin s3.client.default.secret_key && \
  # We aren't doing per-container persistence right now
  # mkdir -p /usr/share/elasticsearch/data/ && \
  # chown -R 1000.1000 /usr/share/elasticsearch/data/ && \
  # chown -R elasticsearch:elasticsearch /usr/share/elasticsearch/data/ && \
  # comment JVM memory options so that they don't override those we pass as container options
  sed -e '/^-Xm/s/^/#/g' -i /usr/share/elasticsearch/config/jvm.options

ADD elasticsearch.yml /usr/share/elasticsearch/config/
RUN chown elasticsearch:elasticsearch /usr/share/elasticsearch/config/elasticsearch.yml
