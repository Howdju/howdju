create table if not exists account_settings (
  account_settings_id serial,
  user_id integer references users(user_id),
  paid_contributions_disclosure varchar(4096),
  created timestamp,
  modified timestamp
);
create unique index if not exists unq_account_settings_user on account_settings (user_id);
