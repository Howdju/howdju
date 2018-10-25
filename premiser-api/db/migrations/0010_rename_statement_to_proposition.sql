alter table statements rename to propositions;
alter table statement_compounds rename to proposition_compounds;
alter table statement_compound_atoms rename to proposition_compound_atoms;
alter table statement_tag_scores rename to proposition_tag_scores;
alter table statement_tag_votes rename to proposition_tag_votes;

alter table justifications rename column root_statement_id to root_proposition_id;
alter table perspectives rename column statement_id to proposition_id;
alter table source_excerpt_paraphrases rename column paraphrasing_statement_id to paraphrasing_proposition_id;
alter table proposition_compounds rename column statement_compound_id to proposition_compound_id;
alter table proposition_compound_atoms rename column statement_compound_id to proposition_compound_id;
alter table proposition_compound_atoms rename column statement_id to proposition_id;
alter table proposition_tag_scores rename column statement_tag_score_id to proposition_tag_score_id;
alter table proposition_tag_scores rename column statement_id to proposition_id;
alter table proposition_tag_votes rename column statement_tag_vote_id to proposition_tag_vote_id;
alter table proposition_tag_votes rename column statement_id to proposition_id;
alter table propositions rename column statement_id to proposition_id;

alter sequence statements_statement_id_seq rename to propositions_proposition_id_seq;
alter sequence statement_compounds_statement_compound_id_seq rename to proposition_compounds_proposition_compound_id_seq;
alter sequence statement_tag_votes_statement_tag_vote_id_seq rename to proposition_tag_votes_proposition_tag_vote_id;

-- we were missing a serial definition on statement_tag_scores
alter table proposition_tag_scores add column proposition_tag_score_id_2 serial primary key;
alter table proposition_tag_scores drop column proposition_tag_score_id;
alter table proposition_tag_scores rename column proposition_tag_score_id_2 to proposition_tag_score_id;


update justification_basis_compound_atoms set entity_type = 'PROPOSITION' where entity_type = 'STATEMENT';
update justifications set target_type = 'PROPOSITION' where target_type = 'STATEMENT';
update justifications set basis_type = 'PROPOSITION_COMPOUND' where basis_type = 'STATEMENT_COMPOUND';