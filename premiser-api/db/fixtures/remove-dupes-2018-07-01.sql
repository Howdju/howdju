update source_excerpt_paraphrases set paraphrasing_statement_id = 1447 where paraphrasing_statement_id = 1448;
update statements set deleted = now() where statement_id = 1448;

-- writ_quotes; for x,y, replace y with x:
-- 292,299
-- 1430,1438
-- 730,731
update writ_quote_urls set writ_quote_id = 292 where writ_quote_id = 299;
update writ_quotes set deleted = now() where writ_quote_id = 299;

update writ_quote_urls set writ_quote_id = 1430 where writ_quote_id = 1438;
update source_excerpt_paraphrases set source_excerpt_id = 1430 where source_excerpt_id = 1438 and source_excerpt_type = 'WRIT_QUOTE';
update writ_quotes set deleted = now() where writ_quote_id = 1438;

update writ_quote_urls set writ_quote_id = 730 where writ_quote_id = 731;
update writ_quotes set deleted = now() where writ_quote_id = 731;

-- This writ_quote isn't referenced anywhere that I can find.
update writ_quotes set deleted = now() where writ_quote_id = 7;
