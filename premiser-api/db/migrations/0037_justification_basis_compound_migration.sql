-- Records appearances that were moved from SourceExcerptParaphrases into independent Appearances
create table source_excerpt_paraphrase_translations(
  source_excerpt_paraphrase_id int not null,
  appearance_id int not null
);

-- Records PropositionCompounds created from the Propositions of a JustificationBasisCompound
create table justification_basis_compound_translations(
  justification_basis_compound_id int not null,
  justification_basis_compound_atom_id int not null,
  proposition_compound_id int not null,
  proposition_compound_atom_id int not null
);
