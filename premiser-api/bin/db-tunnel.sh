#!/usr/bin/env bash

set -e

# Sets up a tunnel between 5434 locally and port 5432 on RDS using an EC2 Instance Connect instance
# as a bastion host.

aws ec2-instance-connect ssh --instance-id $BASTION_INSTANCE_ID --local-forwarding 5434:$RDS_ADDRESS:5432
