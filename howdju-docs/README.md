# howdju-docs

A Nextra-based documentation site for docs.howdju.com.

## Development

```sh
yarn run dev
```

## Deployment

```sh
yarn run build-and-export
```

Upload contents of `out` folder to s3://docs.howdju.com.

```sh
aws-vault exec user@howdju -- aws s3 sync out s3://docs.howdju.com
aws-vault exec user@howdju -- aws cloudfront create-invalidation --distribution-id ECBMF327IDKRF --paths '/*'
```

If you update `not-found.html`, upload that too.

```sh
aws-vault exec carl@howdju -- aws s3 cp not-found.html s3://docs.howdju.com
```
