#!/usr/bin/env bash

security_group_id=$1
aws ec2 describe-network-interfaces --filters Name=group-id,Values=$security_group_id
