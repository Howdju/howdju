create table if not exists content_reports (
  content_report_id bigserial,
  entity_type varchar(64),
  entity_id integer,
  url varchar(65536),
  types varchar(64)[],
  description varchar(4096),
  reporter_user_id integer references users(user_id),
  created timestamp
);
