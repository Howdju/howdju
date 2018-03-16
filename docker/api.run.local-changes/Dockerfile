# Build and deploy the api!
# [[host:port/]registry/]name[:tag][@digest]
FROM library/amazonlinux:2017.09

RUN \
  # create .bashrc so that the nvm install can modify it
  touch /root/.bashrc && \
  yum update && \
  # My yarn install fails without Git...
#  yum install -y git && \
  # yum groupinstall "Development Tools" && \
  curl -sS -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash && \
  . ~/.nvm/nvm.sh && \
  nvm install 6.10.3 && \
  npm install -g yarn

COPY config/docker/.aws /root/.aws
COPY config/docker/id_rsa_howdju_readonly /root/.ssh/id_rsa
COPY config/docker/id_rsa_howdju_readonly.pub /root/.ssh/id_rsa.pub
COPY docker/config/bitbucket-known_hosts /root/.ssh/known_hosts

# howdju base ^^

# Copy local changes
COPY premiser-api /howdju/premiser-api
COPY howdju-ops /howdju/howdju-ops
COPY howdju-common /howdju/howdju-common
COPY howdju-service-common /howdju/howdju-service-common

WORKDIR /howdju/premiser-api

RUN \
  . ~/.nvm/nvm.sh && \
  yarn add /howdju/howdju-ops && \
  yarn add /howdju/howdju-common && \
  yarn add /howdju/howdju-service-common && \
  yarn install

CMD yarn run local
