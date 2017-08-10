insert into statement_compound_atoms (statement_compound_id, statement_id, order_position)
(select statement_id, statement_id, 0 from statements);

insert into statement_compounds (statement_compound_id) select statement_compound_id from statement_compound_atoms;
select setval('statement_compounds_statement_compound_id_seq', (select max(statement_compound_id) FROM statement_compounds));

update justifications set basis_type = 'STATEMENT_COMPOUND' where basis_type = 'STATEMENT';
