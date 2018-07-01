-- Non-empty
select * from statements where text is null or text ~ '^\s*$';
select * from statements where normal_text is null or normal_text ~ '^\s*$';
select * from writs where title is null or title ~ '^\s*$';
select * from writs where normal_title is null or normal_title ~ '^\s*$';
select * from justifications where root_statement_id is null;
select * from justifications where root_polarity is null;
select * from justifications where polarity is null or polarity not in ('POSITIVE', 'NEGATIVE');
select * from justifications where target_type is null or target_type not in ('STATEMENT', 'JUSTIFICATION');
select * from justifications where basis_type is null or basis_type not in ('JUSTIFICATION_BASIS_COMPOUND', 'STATEMENT_COMPOUND', 'WRIT_QUOTE');
select * from justification_basis_compound_atoms where entity_type is null or entity_type not in ('STATEMENT', 'SOURCE_EXCERPT_PARAPHRASE');

-- Uniqueness

-- statements
with
    duplicates as (
      select normal_text
      from statements
        where deleted is null
      group by normal_text
      having count(normal_text) > 1
  )
select * from statements join duplicates using (normal_text) order by text, statement_id;

-- urls
with
    duplicates as (
      select url
      from urls
      group by url
      having count(url) > 1
  )
select * from urls join duplicates using (url) order by url, url_id;

-- writs
with
    duplicates as (
      select normal_title
      from writs
      group by normal_title
      having count(normal_title) > 1
  )
select * from writs join duplicates using (normal_title) order by normal_title, writ_id;

-- writ_quotes
with
    dupe_counts as (
      select
        *
        , count(*) over (partition by writ_id, normal_quote_text) as dupe_count
      from writ_quotes
  )
select * from dupe_counts where dupe_count > 1
order by normal_quote_text, writ_quote_id;


-- Referential integrity
select * from statements where creator_user_id is null;

with
  statement_justifications as (
    select
        j.*
      , s.statement_id
    from justifications j
      left join statements s on j.target_id = s.statement_id
    where j.target_type = 'STATEMENT'
  )
select * from statement_justifications where statement_id is null;
-- justification_basis_compound_atoms statements/paraphrases

-- Atom counts
select
    c.justification_basis_compound_id
  , count(justification_basis_compound_atom_id)
from justification_basis_compounds c
  join justification_basis_compound_atoms a using (justification_basis_compound_id)
group by justification_basis_compound_id
having count(justification_basis_compound_atom_id) < 1;

-- Ensure an atom isn't duplicated in a compound

-- Ensure the thing something relies upon isn't deleted.  E.g. if a statement was deleted, then we should delete it's atoms, compounds, and justifications
