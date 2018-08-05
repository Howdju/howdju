# Builds a container with the latest master branch

FROM howdju/premiser-api-base

ARG keyfile_password
# Setting this variable to a unique value invalidates after here so that the git clone is not cached. (could also modify filesystem based upon git SHA?)
ARG current_date=not_a_date
RUN \
  eval `ssh-agent` && \
  /root/bin/magic-ssh-add.sh $keyfile_password && \
  ssh-keyscan -t rsa bitbucket.org >> $HOME/.ssh/known_hosts && \
  git clone git@bitbucket.org:howdju/premiser.git /howdju && \
  cd /howdju && \
  git checkout master && \
  source $HOME/.bashrc && \
  bin/link.sh && \
#  bin/install-all.sh && \
  cd /howdju/premiser-api/ && \
  yarn install && \
  cd /howdju/howdju-ops/ && \
  yarn install && \
  curl https://bootstrap.pypa.io/get-pip.py -o- | python && \
  pip install awscli --upgrade --user && \
  echo 'export PATH=$HOME/.local/bin/:$PATH' >> $HOME/.bashrc

WORKDIR /howdju/premiser-api

CMD /bin/bash
