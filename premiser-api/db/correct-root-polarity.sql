update justifications j
  set root_polarity = case when tj.root_polarity = 'POSITIVE' then 'NEGATIVE' else 'POSITIVE' end
  from justifications tj
  where j.target_type = 'JUSTIFICATION' and j.target_id = tj.justification_id