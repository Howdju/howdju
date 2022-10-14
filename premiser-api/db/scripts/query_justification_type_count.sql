select
  basis_type,
  count(*) as count
from
  justifications j
group by j.basis_type
order by count desc;
