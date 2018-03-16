# Builds a container with the latest master branch
FROM library/amazonlinux:2017.09

ARG keyfile_password

RUN \
  # create .bashrc so that the nvm install can modify it
  touch /root/.bashrc && \
  yum update && \
  curl -sS -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash && \
  . ~/.nvm/nvm.sh && \
  nvm install 6.10.3 && \
  npm install -g yarn

COPY config/docker/.aws /root/.aws
COPY config/docker/id_rsa_howdju_readonly /root/.ssh/id_rsa
COPY config/docker/id_rsa_howdju_readonly.pub /root/.ssh/id_rsa.pub
COPY docker/config/bitbucket-known_hosts /root/.ssh/known_hosts
COPY bin/docker/magic-ssh-add.sh /root/bin/magic-ssh-add.sh

# howdju base ^^

RUN \
  yum install -y git && \
  eval `ssh-agent` && \
  /root/bin/magic-ssh-add.sh $keyfile_password && \
  git clone git@bitbucket.org:howdju/howdju.git /howdju && \
  cd /howdju && \
  git checkout master

WORKDIR /howdju/premiser-api

CMD /bin/bash
