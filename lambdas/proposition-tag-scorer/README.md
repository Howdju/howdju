# howdju-message-handler

This lambda scores proposition tag votes. It should be run on a schedule.

## Releasing

```sh
aws-vault exec username@howdju -- yarn run release
```

(See the section in Development.md about setting up aws-vault.)

Then:

- Update the Lambda's code in the AWS console by copy/pasting the new ZIP file's S3 location.
- Publish a new version of the Lambda
- Update the `prod` alias to point to the new version.
