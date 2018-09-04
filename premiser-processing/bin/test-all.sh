#!/usr/bin/env bash

for lambda_dir in lambda-functions/*; do
  (cd $lambda_dir; yarn test)
done
