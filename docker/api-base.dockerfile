FROM library/amazonlinux:2.0.20210326.0

RUN \
  yum -y update && \
  yum -y install \
    # used by nodenv install
    tar \
    git \
    # necessary to build bcrypt
    gcc-c++ make \
    # used by lambda-smoke-test.sh
    openssl \
    python3 \
    && \
  # configuring git allows us to stash changes
  git config --global user.email "root@docker" && \
  git config --global user.name "root@docker" && \
  git clone https://github.com/nodenv/nodenv.git $HOME/.nodenv && \
  echo 'export PATH="$HOME/.nodenv/bin:$PATH"' >> $HOME/.bashrc && \
  echo 'eval "$(nodenv init -)"' >> $HOME/.bashrc && \
  source $HOME/.bashrc && \
  git clone https://github.com/nodenv/node-build.git $(nodenv root)/plugins/node-build && \
  nodenv install 14.16.0 && \
  nodenv global 14.16.0 && \
  npm install -g npm && \
  npm install -g yarn

COPY config/docker/.aws /root/.aws
COPY config/docker/id_rsa_howdju_readonly /root/.ssh/id_rsa
COPY config/docker/id_rsa_howdju_readonly.pub /root/.ssh/id_rsa.pub
COPY bin/docker/magic-ssh-add.sh /root/bin/magic-ssh-add.sh

CMD /bin/bash
