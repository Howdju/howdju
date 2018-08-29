# Deploying Lambdas


Build the image:

```
# From the root directory (premiser-processing/..)
docker build -f premiser-processing/lambda-build.dockerfile -t lambda-build .
```

Run the commands in the container:

```
ld=statement-tag-scorer
  docker run --rm lambda-build bash -c \
    "source \$HOME/.bashrc && yarn build-lambda-function --lambdaDir $ld && yarn update-lambda-function-code --lambdaDir $ld"

desc=$(git log -1 --format='%aI %h %s')
ld=statement-tag-scorer
  docker run --rm lambda-build bash -c \
    "source \$HOME/.bashrc && yarn publish-lambda-function-version --lambdaDir $ld --versionDescription '$desc'"

ld=statement-tag-scorer
an=pre-prod
nt=4
  docker run --rm lambda-build bash -c \
    "source \$HOME/.bashrc && yarn update-lambda-function-alias --lambdaDir $ld --aliasName $an --newTarget $nt"
```
