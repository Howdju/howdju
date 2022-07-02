select
  p.proposition_id,
  substring(p.text, 0, 128),
  count(*) as justification_count,
  count(*) filter (where j.target_type = 'JUSTIFICATION') as counter_justification_count
from
  justifications j
    join propositions p on j.root_target_id = p.proposition_id and j.deleted is null and p.deleted is null
group by p.proposition_id, substring(p.text, 0, 128)
order by justification_count desc
limit 100;
