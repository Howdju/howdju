# howdju-docs

A Nextra-based documentation site for docs.howdju.com.

## Development

Running the live-reload dev version:

```sh
yarn run dev
```

Running the build-once prod version locally:

```sh
yarn run build-and-start
```

## Deployment

Build the docs locally:

```sh
yarn run build-and-export
```

Upload contents of `out` folder to s3://docs.howdju.com:

```sh
aws-vault exec user@howdju -- aws s3 sync out s3://docs.howdju.com
aws-vault exec user@howdju -- aws cloudfront create-invalidation --distribution-id ECBMF327IDKRF --paths '/*'
```

To check on the progress of the invalidation:

```sh
aws-vault exec user@howdju -- aws cloudfront get-invalidation --distribution-id ECBMF327IDKRF --id <invalidation-id>
```

where `<invalidation-id>` comes from the output of the `create-invalidation` command.

If you update `not-found.html`, upload that too.

```sh
aws-vault exec user@howdju -- aws s3 cp not-found.html s3://docs.howdju.com
```
