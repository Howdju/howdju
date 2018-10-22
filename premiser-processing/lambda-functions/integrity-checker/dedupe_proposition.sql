update justifications set root_proposition_id = $1 where root_proposition_id = $2;
update perspectives set proposition_id = $1 where proposition_id = $2;
update source_excerpt_paraphrases set paraphrasing_proposition_id = $1 where paraphrasing_proposition_id = $2;
update proposition_compound_atoms set paraphrasing_proposition_id = $1 where paraphrasing_proposition_id = $2;
update proposition_tag_votes set proposition_id = $1 where proposition_id = $2;
delete from proposition_tag_scores where proposition_id = $1;
delete from propositions where proposition_id = $1;
