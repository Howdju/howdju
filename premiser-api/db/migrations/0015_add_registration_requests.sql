alter table users add column if not exists username varchar(64);
create unique index if not exists unq_users_username on users (username);
alter table users add column if not exists accepted_terms timestamp;

create table if not exists registration_requests (
  registration_request_id serial primary key,
  email varchar(128) not null,
  registration_code varchar(1024) not null,
  is_consumed boolean not null default false,
  expires timestamp not null,
  created timestamp not null,
  deleted timestamp
);

create unique index if not exists unq_registration_requests_email on registration_requests (email);
create unique index if not exists unq_registration_requests_code on registration_requests (registration_code);
