#!/usr/bin/env bash

install_nginx() {
  # Using OS repository:
  yum install epel-release
  yum update
  yum install nginx
  # Verify the installation
  # nginx -v
  cp nginx.conf /etc/nginx/nginx.conf

  # https://www.digitalocean.com/community/tutorials/how-to-set-up-password-authentication-with-nginx-on-ubuntu-14-04
  echo -n '${kibana_nginx_username}:' >> /etc/nginx/.htpasswd
  echo -n '${kibana_nginx_password}' | openssl passwd -apr1 >> /etc/nginx/.htpasswd
}

install_jq() {
  curl -L -o jq https://github.com/stedolan/jq/releases/download/jq-1.5/jq-linux64
  chmod +x ./jq
  mkdir -p .local/bin
  mv jq $HOME/.local/bin
}

install_nginx
nginx start

install_jq
