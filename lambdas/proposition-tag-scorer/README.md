# howdju-message-handler

This lambda scores proposition tag votes. It should be run on a schedule.

## Releasing

```sh
aws-vault exec username@howdju -- yarn run release
```

(See the section in Development.md about setting up aws-vault.)

Manually update the proposition-tag-scorer Lambda code from the Lambda console by copy/pasting the
new ZIP file's S3 location.
