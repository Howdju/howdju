create table if not exists password_reset_requests (
  password_reset_request_id serial primary key,
  user_id integer references users (user_id), 
  email varchar(128) not null, 
  password_reset_code varchar(1024) not null, 
  expires timestamp not null, 
  is_consumed boolean not null, 
  created timestamp not null,
  deleted timestamp
);

create index if not exists unq_password_reset_requests_password_reset_code on password_reset_requests (password_reset_code);
