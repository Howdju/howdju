------------------
-- Useful scripts:
------------------

-- See writ quotes and URLS of empty writ titles
with
    empty_writs as (
      SELECT *
      FROM writs
      WHERE title IS NULL OR title = ''
  )
select
  wq.writ_quote_id
  , wq.writ_id
  , wq.quote_text
  , urls.url
from writ_quotes wq
  join empty_writs using (writ_id)
  join writ_quote_urls using (writ_quote_id)
  join urls using (url_id)
order by wq.created desc;

-- Dependencies on duplicate propositions
with
    duplicate_normal_texts as (
      select
        normal_text,
        row_number() over () as duplicate_number
      from propositions
      where deleted is null
      group by normal_text
      having count(normal_text) > 1
  )
  , duplicate_propositions as (
    select s.*, ds.duplicate_number from propositions s join duplicate_normal_texts ds using (normal_text) order by s.text, s.proposition_id
)
  , duplicate_justification_basis_compound_atoms as (
    select
      a.*
      , ds.proposition_id as duplicate_proposition_id
      , ds.duplicate_number
    from justification_basis_compound_atoms a
      join duplicate_propositions ds on a.entity_id = ds.proposition_id
    where a.entity_type = 'PROPOSITION'
)
  , duplicate_proposition_compound_atoms as (
    select
      a.*
      , ds.proposition_id as duplicate_proposition_id
      , ds.duplicate_number
    from proposition_compound_atoms a
      join duplicate_propositions ds using (proposition_id)
)
  , duplicate_paraphrases as (
    select
      p.*
      , ds.proposition_id as duplicate_proposition_id
      , ds.duplicate_number
    from source_excerpt_paraphrases p
      join duplicate_propositions ds on p.paraphrasing_proposition_id = ds.proposition_id
)
  , duplicate_justification_targets as (
    select
      j.*
      , ds.proposition_id as duplicate_proposition_id
      , ds.duplicate_number
    from justifications j
      join duplicate_propositions ds on j.target_id = ds.proposition_id
    where j.target_type = 'PROPOSITION'
)
select
    'proposition_compound_atom.proposition_id' as type
  , proposition_id as id
  , duplicate_proposition_id
  , duplicate_number
from duplicate_proposition_compound_atoms
union
select
  'justification_basis_compound_atom_id'
  , justification_basis_compound_atom_id
  , duplicate_proposition_id
  , duplicate_number
from duplicate_justification_basis_compound_atoms
union
select
  'paraphrasing_proposition_id'
  , paraphrasing_proposition_id
  , duplicate_proposition_id
  , duplicate_number
from duplicate_paraphrases
union
select
  'justification_id'
  , justification_id
  , duplicate_proposition_id
  , duplicate_number
from duplicate_justification_targets
order by duplicate_number, duplicate_proposition_id;

-- Writ quotes using duplicate URLs
with
    duplicates as (
      select url
      from urls
      group by url
      having count(url) > 1
  )
  , duplicate_urls as (
    select * from urls join duplicates using (url) order by url, url_id
)
select
  wq.quote_text
  , w.title
  , u.url_id
  , u.url
from
  writ_quotes wq
  join writs w using (writ_id)
  join writ_quote_urls wqu using (writ_quote_id)
  join duplicate_urls u using (url_id);

-- Writ quotes and URLS using duplicate writs
with
    duplicates as (
      select normal_title
      from writs
      group by normal_title
      having count(normal_title) > 1
  )
  , duplicate_writs as (
    select * from writs join duplicates using (normal_title) order by normal_title, writ_id
)
select
  wq.quote_text
  , w.title
  , u.url_id
  , u.url
from
  writ_quotes wq
  join duplicate_writs w using (writ_id)
  join writ_quote_urls wqu using (writ_quote_id)
  join urls u using (url_id);

-- Duplicate writs having different URLs
with
    duplicate_writ_titles as (
      select normal_title
      from writs
      group by normal_title
      having count(normal_title) > 1
  )
  , duplicate_writs as (
    select * from writs join duplicate_writ_titles using (normal_title) order by normal_title, writ_id
)
  , normal_title_urls as (
    select distinct
      w.normal_title
      , u.url_id
      , u.url
    from
      writ_quotes wq
      join duplicate_writs w using (writ_id)
      join writ_quote_urls wqu using (writ_quote_id)
      join urls u using (url_id)
)
  , normal_title_multiple_urls as (
    select normal_title, count(*) from normal_title_urls group by normal_title having count(*) > 1
)
  , duplicate_writs_multiple_urls as (
    select
      wq.quote_text
      , w.title
      , w.writ_id
      , u.url
    from
      writ_quotes wq
      join writs w using (writ_id)
      join normal_title_multiple_urls using (normal_title)
      join writ_quote_urls wqu using (writ_quote_id)
      join urls u using (url_id)
    order by normal_title, url
)
select * from duplicate_writs_multiple_urls;

-- URLs having multiple titles through their writ quotes
with
    url_titles as (
      select distinct
        w.normal_title
        , u.url
      from
        writ_quotes wq
        join writs w using (writ_id)
        join writ_quote_urls wqu using (writ_quote_id)
        join urls u using (url_id)
      where
        wq.deleted is null
        and w.deleted is null
        and wqu.deleted is null
        and u.deleted is null
  )
  , urls_with_multiple_titles as (
    select url
    from url_titles
    group by url
    having count(*) > 1
)
  , urls_with_multiple_titles_info as (
    select
      wq.quote_text
      , w.title
      , w.writ_id
      , u.url
    from
      writ_quotes wq
      join writs w using (writ_id)
      join writ_quote_urls wqu using (writ_quote_id)
      join urls u using (url_id)
      join urls_with_multiple_titles using (url)
    order by url, normal_title
)
select * from urls_with_multiple_titles_info;
