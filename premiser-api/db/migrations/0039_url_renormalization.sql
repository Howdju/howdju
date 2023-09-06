create table url_renormalization_progress (
  normalized_url_id int not null,
  old_url text,
  new_url text,
  replacement_url_id int
);

create table url_renormalization_progress_2 (
  normalized_url_id int not null,
  old_url text,
  new_url text,
  replacement_url_id int
);
