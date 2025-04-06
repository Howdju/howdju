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

## Upgrading Postgres version

```shell
cd premiser-api
aws-vault exec user@howdju -- yarn run db:tunnel

# in another terminal:
pg_dump_file_name=premiser_preprod_dump-$(date -u +"%Y-%m-%dT%H-%M-%SZ").sql
pg_dump -h 127.0.0.1 -p 5434 premiser -U premiser_rds > $pg_dump_file_name
# you can kill `yarn run db:tunnel` once this completes

# In any available terminal (fill in a password for the postgres user):
printf 'Enter Postgres superuser password:'; read -s POSTGRES_SUPERUSER_PASSWORD
docker run -d -p 5432:5432 --name howdju_postgres_16 -e POSTGRES_PASSWORD=$POSTGRES_SUPERUSER_PASSWORD postgres:16.3

# If you want to see the output from the db, either omit -d from the run command or run:
docker logs howdju_postgres_16 --follow

# In any available terminal, run the following:

# Choose a premiser_api password and update the config/local*.env files
psql --echo-all -h localhost -U postgres < db/create-users.sql
echo 'create database premiser;' | psql -h localhost -U postgres
psql --echo-all -h localhost -U postgres premiser < db/migrations/0000_db-users-privileges.sql
psql -h localhost -U postgres --set ON_ERROR_STOP=on premiser < $pg_dump_file_name
rm $pg_dump_file_name
```
