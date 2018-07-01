update writ_quote_urls set writ_quote_id = $1 where writ_quote_id = $2;
update source_excerpt_paraphrases set source_excerpt_id = $1 where source_excerpt_id = $2 and source_excerpt_type = 'WRIT_QUOTE';
delete from writ_quotes where writ_quote_id = $1;
