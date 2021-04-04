# Builds a container with the latest master branch

FROM howdju/premiser-api-base

ARG keyfile_password
# Setting this variable to a unique value invalidates after here so that the git clone is not cached.
ARG current_date=not_a_date
ARG git_branch=master
# A better way to do this would be to inspect the git repo: https://stackoverflow.com/a/39278224/39396
#   TODO how get the access_token? https://developer.atlassian.com/bitbucket/api/2/reference/meta/authentication
# ADD https://api.bitbucket.org/2.0/repositories/howdju/premiser/refs/branches/master?access_token={access_token} howdju-premiser-master.json
RUN \
  eval `ssh-agent` && \
  /root/bin/magic-ssh-add.sh $keyfile_password && \
  ssh-keyscan -t rsa bitbucket.org >> $HOME/.ssh/known_hosts && \
  git clone git@bitbucket.org:howdju/premiser.git /howdju && \
  cd /howdju && \
  git checkout $git_branch && \
  source $HOME/.bashrc && \
  bin/link.sh && \
  cd /howdju/premiser-api/ && \
  yarn install && \
  cd /howdju/howdju-ops/ && \
  yarn install && \
  pip3 install awscli --upgrade --user && \
  # install jq
  curl -L -o jq https://github.com/stedolan/jq/releases/download/jq-1.5/jq-linux64 && \
  chmod +x ./jq && \
  mv jq $HOME/.local/bin && \
  echo 'export PATH=$HOME/.local/bin/:$PATH' >> $HOME/.bashrc

WORKDIR /howdju/premiser-api

CMD /bin/bash
