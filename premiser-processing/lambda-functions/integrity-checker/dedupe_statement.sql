update justifications set root_statement_id = $1 where root_statement_id = $2;
update perspectives set statement_id = $1 where statement_id = $2;
update source_excerpt_paraphrases set paraphrasing_statement_id = $1 where paraphrasing_statement_id = $2;
update statement_compound_atoms set paraphrasing_statement_id = $1 where paraphrasing_statement_id = $2;
update statement_tag_votes set statement_id = $1 where statement_id = $2;
delete from statement_tag_scores where statement_id = $1;
delete from statements where statement_id = $1;
