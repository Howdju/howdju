-- with
--   root_statement_id as (select 1394 as root_statement_id)
-- select *
-- from
--   statements rs
--   join root_statement_id rsi on rs.statement_id = rsi.root_statement_id
--   join justifications j on j.root_statement_id = rs.statement_id
--   left join citation_references cr on
--         j.basis_id = cr.citation_reference_id
--     and j.basis_type = 'CITATION_REFERENCE'
--   left join citations c on cr.citation_id = c.citation_id
--   left join statement_compounds sc on
--         j.basis_id = sc.statement_compound_id
--     and j.basis_type = 'STATEMENT_COMPOUND'
--   left join statement_compound_atoms sca on
--         sc.statement_compound_id = sca.statement_compound_id
--   left join statements scas on sca.statement_id = scas.statement_id

insert into statements (statement_id, text, created) values
(8, 'By law, no building in Washington, D.C. may be taller than the Capital Building', NOW()),
(9, 'Buildings in Washington, D.C. may be no taller than the width of the street it fronts plus 20 feet', NOW()),
(10, 'In DC no building may be taller than the Cairo', NOW()),
select setval('statements_statement_id_seq', (select max(statement_id) from statements));

insert into statement_compounds (statement_compound_id, created) values
(1, NOW()),
(2, NOW()),
(3, NOW());
select setval('statement_compound_statement_compound_id_seq', (select max(statement_compound_id) from statement_compounds));

insert into statement_compound_atoms (statement_compound_id, statement_id) values
(1, 10),
(2, 9);

insert into citations (citation_id, text, created) values
(1, 'DC Code - § 6–601.05 (a). Street width to control building height; business streets; residence streets; specified properties; structures above top story of building.', NOW());
(2, 'Kirk Janowiak''s answer to Why doesn''t Washington DC have any high rise buildings compared to most American cities of a similar size? - Quora', NOW());
select setval('citations_citation_id_seq', (select max(citation_id) from citations));

insert into citation_references (citation_reference_id, citation_id, created, quote) values
(1, 1, NOW(), 'No building shall be erected, altered, or raised in the District of Columbia in any manner so as to exceed in height above the sidewalk the width of the street, avenue, or highway in its front, increased by 20 feet;'),
(2, 2, NOW(), 'There is a municipal code that no building in the actual District may rise higher in elevation than the Capitol building.');
select setval('citation_references_citation_reference_id_seq', (select max(citation_reference_id) from citation_references));

insert into urls (url_id, url, created) values
(1, 'https://beta.code.dccouncil.us/dc/council/code/sections/6-601.05.html', NOW()),
(2, 'https://www.quora.com/Why-doesnt-Washington-DC-have-any-high-rise-buildings-compared-to-most-American-cities-of-a-similar-size/answer/Kirk-Janowiak', NOW());
select setval('urls_url_id_seq', (select max(url_id) from urls));

insert into citation_reference_urls (citation_reference_id, url_id, created) values
(1, 1, NOW()),
(2, 2, NOW());

insert into justifications (justification_id, root_statement_id, root_polarity, target_type, target_id, basis_type, basis_id, polarity, created) values
(8,  8, 'POSITIVE', 'STATEMENT', 8, 'CITATION_REFERENCE', 2, 'POSITIVE', NOW()),
(9,  8, 'NEGATIVE', 'JUSTIFICATION', 8, 'STATEMENT_COMPOUND', 1, 'NEGATIVE', NOW()),
(10, 8, 'NEGATIVE', 'STATEMENT', 8, 'CITATION_REFERENCE', 1, 'NEGATIVE', NOW()),
(11, 8, 'NEGATIVE', 'STATEMENT', 8, 'STATEMENT_COMPOUND', 1, 'NEGATIVE', NOW()),
(12, 8, 'NEGATIVE', 'STATEMENT', 8, 'STATEMENT_COMPOUND', 1, 'NEGATIVE', NOW()),
select setval('justifications_justification_id_seq', (select max(justification_id) from justifications));