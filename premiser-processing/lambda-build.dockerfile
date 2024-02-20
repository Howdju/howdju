FROM library/amazonlinux

# TODO: replace with esbuild bundling like in premiser-api

RUN \
  yum -y update && \
  yum -y install \
  git \
  # necessary to build bcrypt
  gcc-c++ make \
  && \
  # configuring git allows us to stash changes
  git config --global user.email "howdju@docker" && \
  git config --global user.name "howdju@docker" && \
  git clone https://github.com/nodenv/nodenv.git $HOME/.nodenv && \
  echo 'export PATH="$HOME/.nodenv/bin:$PATH"' >> $HOME/.bashrc && \
  echo 'eval "$(nodenv init -)"' >> $HOME/.bashrc && \
  source $HOME/.bashrc && \
  git clone https://github.com/nodenv/node-build.git $(nodenv root)/plugins/node-build && \
  nodenv install 8.10.0 && \
  nodenv global 8.10.0 && \
  npm install -g yarn

COPY config/docker/.aws /root/.aws
COPY . /howdju/

RUN \
  source $HOME/.bashrc && \
  cd /howdju && \
  # TODO could speed up image build by only installing required packages
  bin/install-all.sh && \
  bin/link.sh

WORKDIR /howdju/premiser-processing/

CMD /bin/bash
