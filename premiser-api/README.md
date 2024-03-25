# Howdju API package

This package contains the handler for Howdju's mono-lambda.

## Connecting to DB

(Admins only)

To connect to the dbs, do the following.

In one terminal do:

```sh
aws-vault exec user@howdju -- yarn run db:tunnel
```

In another terminal then do:

```sh
yarn run db:tunnel:shell:prod
```

You'll need env vars `BASTION_INSTANCE_ID` and `RDS_ADDRESS` set in your env. file.
`BASTION_INSTANCE_ID` corresponds to `bastion_instance_id` from Terraform and
`RDS_ADDRESS` must be looked up in the AWS console.

And enter the Postgres password.

### Too many authentication failures

EC2 Instance Connect's ephemeral keys may build up, leading to:

```text
Received disconnect from UNKNOWN port 65535:2: Too many authentication failures
Disconnected from UNKNOWN port 65535
```

To fix it, run the following to clear out your saved keys.

```sh
ssh-agent -D
```
