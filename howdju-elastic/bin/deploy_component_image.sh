#!/usr/bin/env bash

set -e

script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
docker_dir=$script_dir/../docker
cd $docker_dir

component=$1
version=$2

account_id=007899441171
region=us-east-1

declare -a build_args
for build_arg in "${@:3}"; do
  build_args+=( "--build-arg" );
  build_args+=( "$build_arg" );
done

docker build $docker_dir -f $docker_dir/$component.dockerfile "${build_args[@]}" --tag howdju/$component:$version
docker tag howdju/$component:$version howdju/$component:latest
docker tag howdju/$component:$version $account_id.dkr.ecr.$region.amazonaws.com/howdju/$component:$version
docker tag howdju/$component:latest $account_id.dkr.ecr.$region.amazonaws.com/howdju/$component:latest

git_tag="docker/howdju/$component/$version"
git tag -f -m $git_tag $git_tag

$(aws ecr get-login --no-include-email --profile=premiser --region=us-east-1)

docker push $account_id.dkr.ecr.$region.amazonaws.com/howdju/$component:$version
docker push $account_id.dkr.ecr.$region.amazonaws.com/howdju/$component:latest
