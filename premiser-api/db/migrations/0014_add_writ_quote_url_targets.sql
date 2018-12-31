create table if not exists writ_quote_url_targets (
  writ_quote_url_target_id serial primary key,
  writ_quote_id integer references writ_quotes(writ_quote_id),
  url_id integer references urls(url_id)
);

create table if not exists writ_quote_url_target_anchors (
  writ_quote_url_target_anchor_id serial primary key,
  writ_quote_url_target_id integer references writ_quotes(writ_quote_id),
  exact_text varchar(65536) not null,
  prefix_text varchar(65535),
  suffix_text varchar(65536)
);
