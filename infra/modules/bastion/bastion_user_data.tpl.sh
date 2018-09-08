#!/usr/bin/env bash

# Using OS repository:
yum install epel-release
yum update
yum install nginx
# Verify the installation
# nginx -v
cp nginx.conf /etc/nginx/nginx.conf

# https://www.digitalocean.com/community/tutorials/how-to-set-up-password-authentication-with-nginx-on-ubuntu-14-04
echo -n 'carl:' >> /etc/nginx/.htpasswd
openssl passwd -kibana >> /etc/nginx/.htpasswd

nginx start
