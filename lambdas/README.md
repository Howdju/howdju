# Howdju lambdas

This directory contains lamdba functions besies the main mono-lambda in
premiser--api.

The lambda functions in premiser-processing/lambda-functions should go here
(if we don't delete them entirely) since the lambdas in this subdirectory follow
more recent patterns.

## Releasing

Each package should define a `release` script based on `bin/release.sh`.

```sh
aws-vault exec user@howdju -- yarn run release
```
