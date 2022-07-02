select
  substring(p.text, 0, 64) as proposition,
  substring(p2.text, 0, 64) as atom,
  substring(p3.text, 0, 64) as counter
from
  justifications j
    join propositions p on j.target_id = p.proposition_id and j.target_type = 'PROPOSITION' and j.deleted is null and p.deleted is null
    join proposition_compounds pc on j.basis_id = pc.proposition_compound_id and j.basis_type = 'PROPOSITION_COMPOUND' and pc.deleted is null
    join proposition_compound_atoms pca on pc.proposition_compound_id = pca.proposition_compound_id
    join propositions p2 on pca.proposition_id = p2.proposition_id
    join justifications cj on cj.target_id = j.justification_id and cj.target_type = 'JUSTIFICATION' and cj.deleted is null
    join proposition_compounds pc2 on cj.basis_id = pc2.proposition_compound_id and cj.basis_type = 'PROPOSITION_COMPOUND' and pc2.deleted is null
    join proposition_compound_atoms pca2 on pc2.proposition_compound_id = pca2.proposition_compound_id
    join propositions p3 on pca2.proposition_id = p3.proposition_id
;
