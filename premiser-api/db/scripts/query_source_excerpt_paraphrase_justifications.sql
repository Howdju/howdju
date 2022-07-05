select 
  p.proposition_id,
  substring(p.text, 0, 128) as text,
  j.polarity,
  p_sep.text as paraphrase,
  substring(wq.quote_text, 0, 128) as quote,
  w.title
from justifications j
  inner join propositions p on
    j.target_type = 'PROPOSITION' and
    j.target_id = p.proposition_id
    and j.basis_type = 'JUSTIFICATION_BASIS_COMPOUND'
  inner join justification_basis_compounds jbc on
    j.basis_id = jbc.justification_basis_compound_id
  inner join justification_basis_compound_atoms jbca using (justification_basis_compound_id)
  inner join source_excerpt_paraphrases sep on
    jbca.entity_type = 'SOURCE_EXCERPT_PARAPHRASE' and
    jbca.entity_id = sep.source_excerpt_paraphrase_id
  inner join propositions p_sep on
    sep.paraphrasing_proposition_id = p_sep.proposition_id
  inner join writ_quotes wq on
    sep.source_excerpt_type = 'WRIT_QUOTE' and
    sep.source_excerpt_id = wq.writ_quote_id
  inner join writs w using (writ_id);
