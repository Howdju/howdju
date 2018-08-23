#!/usr/bin/env bash

script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
docker_dir=$script_dir/../docker
cd $docker_dir

version=$1

account_id=007899441171
region=us-east-1

docker build . -f $docker_dir/elasticsearch.dockerfile --tag howdju/elasticsearch:$version
docker tag howdju/elasticsearch:$version howdju/elasticsearch:latest
docker tag howdju/elasticsearch:$version $account_id.dkr.ecr.$region.amazonaws.com/howdju/elasticsearch:$version
docker tag howdju/elasticsearch:latest $account_id.dkr.ecr.$region.amazonaws.com/howdju/elasticsearch:latest

docker build . -f $docker_dir/kibana.dockerfile --tag howdju/kibana:$version
docker tag howdju/kibana:$version howdju/kibana:latest
docker tag howdju/kibana:$version $account_id.dkr.ecr.$region.amazonaws.com/howdju/kibana:$version
docker tag howdju/kibana:latest $account_id.dkr.ecr.$region.amazonaws.com/howdju/kibana:latest

$(aws ecr get-login --no-include-email --profile=premiser --region=us-east-1)

docker push $account_id.dkr.ecr.$region.amazonaws.com/howdju/elasticsearch:$version
docker push $account_id.dkr.ecr.$region.amazonaws.com/howdju/elasticsearch:latest
docker push $account_id.dkr.ecr.$region.amazonaws.com/howdju/kibana:$version
docker push $account_id.dkr.ecr.$region.amazonaws.com/howdju/kibana:latest
