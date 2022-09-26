
set -e

# Env should be one of pre-prod, prod.
env=$1

yarn run check:pre-deploy
# Don't lint or test if we are in the CI environment. We should already have
# done that prior to kicking off the deployment
if [ -z ${HOWDJU_RUNNING_IN_GITHUB_WORKFLOW+present} ]; then
  yarn run lint
  yarn run test
else
  echo Skipping lint and test because in Github Workflow
fi
yarn run build-"${env}"
yarn run upload-"${env}"
yarn run invalidate:ui:"${env}"
