# Deploying Lambdas

Build the image:

```
# From the root directory (premiser-processing/..)
docker build -f premiser-processing/lambda-build.dockerfile -t lambda-build .
```

Then select one of three ways to update the Lambda function code.

## Option 1: Deploying the Lambda directly

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

## Option 2: S3 Upload

If you want only to upload the built Lambda function to S3 (e.g., so that Terraform can update the actual code
of the Lambda function):

```
cd premiser-processing
ld=statement-tag-scorer
  docker run --rm lambda-build bash -c \
    "source \$HOME/.bashrc && yarn build-lambda-function --lambdaDir $ld && yarn upload-lambda-function-zip --lambdaDir $ld"
```

Then you'll want to do something like the following:

```
cd infra
terraform apply
```

## Option 3: Copying Lambda Function ZIP file

(I haven't tested the commands below yet)

```
ld=statement-tag-scorer
  docker run --name lambda_build--rm lambda-build bash -c \
    "source \$HOME/.bashrc && yarn build-lambda-function --lambdaDir $ld && bash" && \
  docker cp lambda_build:/howdju/premiser-processing/dist/lambda-functions/$ld/$ld.zip $ld.zip
```

Then apply the Terraform plan (it must be configured to find the lambda function ZIP file.)

```
# (If terraform is written to upload $ld.zip to S3)
terraform apply
```