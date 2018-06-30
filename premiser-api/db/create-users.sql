-- Necessary for local database if you will load a pg_dump from RDS
create role premiser_rds;
create role rdsadmin;
create role PUBLIC;

-- As premiser_rds
create user premiser_admin;
\password premiser_admin

-- As premiser_rds
create user premiser_api;
\password premiser_api
