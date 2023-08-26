-- Keeps track of when we replaced a URL with another that already had a URL equal
-- canonicalizing the first (#494).
create table url_normalization_progress (
  normalized_url_id int not null,
  old_url text,
  replacement_url_id int
);

-- Records the MediaExcerpts we created for each WritQuote
create table writ_quote_translations (
  writ_quote_id int not null,
  media_excerpt_id int not null
);
