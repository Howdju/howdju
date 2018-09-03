# Deploying Lambdas

Build the image:

```
# From the root directory (premiser-processing/..)
docker build -f premiser-processing/lambda-build.dockerfile -t lambda-build .
```

Run the commands in the container:

```
# build and update the lambda function
ld=statement-tag-scorer
  docker run --rm lambda-build bash -c \
    "source \$HOME/.bashrc && yarn build-lambda-function --lambdaDir $ld && yarn update-lambda-function-code --lambdaDir $ld"

# publish a lambda function version
desc=$(git log -1 --format='%aI %h %s')
ld=statement-tag-scorer
  docker run --rm lambda-build bash -c \
    "source \$HOME/.bashrc && yarn publish-lambda-function-version --lambdaDir $ld --versionDescription '$desc'"

# update the lambda function alias
ld=statement-tag-scorer
an=pre-prod
nt=4
  docker run --rm lambda-build bash -c \
    "source \$HOME/.bashrc && yarn update-lambda-function-alias --lambdaDir $ld --aliasName $an --newTarget $nt"
```

## S3 Upload

```
ld=statement-tag-scorer
  docker run --rm lambda-build bash -c \
    "source \$HOME/.bashrc && yarn build-lambda-function --lambdaDir $ld && yarn upload-lambda-function-zip --lambdaDir $ld"
# (If terraform is written to look for the ZIP file directly in S3)
terraform apply
```

## Copying Lambda Function ZIP file

```
ld=statement-tag-scorer
  docker run --name lambda_build--rm lambda-build bash -c \
    "source \$HOME/.bashrc && yarn build-lambda-function --lambdaDir $ld && bash" && \
  docker cp lambda_build:/howdju/premiser-processing/dist/lambda-functions/$ld/$ld.zip $ld.zip
# (If terraform is written to upload $ld.zip to S3)
terraform apply
```