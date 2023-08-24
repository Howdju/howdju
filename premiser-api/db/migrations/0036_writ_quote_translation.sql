-- Records the MediaExcerpts we created for each WritQuote
create table writ_quote_translations (
  writ_quote_id int not null,
  media_excerpt_id int not null
  );
