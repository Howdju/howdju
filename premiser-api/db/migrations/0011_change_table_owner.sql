-- must run as a user with permission, such as premiser_rds
alter table public.actions                            owner to premiser_admin;
alter table public.group_permissions                  owner to premiser_admin;
alter table public.groups                             owner to premiser_admin;
alter table public.job_history                        owner to premiser_admin;
alter table public.justification_basis_compound_atoms owner to premiser_admin;
alter table public.justification_basis_compounds      owner to premiser_admin;
alter table public.justification_scores               owner to premiser_admin;
alter table public.justification_votes                owner to premiser_admin;
alter table public.justifications                     owner to premiser_admin;
alter table public.migration_translations             owner to premiser_admin;
alter table public.permissions                        owner to premiser_admin;
alter table public.perspective_justifications         owner to premiser_admin;
alter table public.perspectives                       owner to premiser_admin;
alter table public.proposition_compound_atoms         owner to premiser_admin;
alter table public.proposition_compounds              owner to premiser_admin;
alter table public.proposition_tag_scores             owner to premiser_admin;
alter table public.proposition_tag_votes              owner to premiser_admin;
alter table public.propositions                       owner to premiser_admin;
alter table public.source_excerpt_paraphrases         owner to premiser_admin;
alter table public.taggings                           owner to premiser_admin;
alter table public.tags                               owner to premiser_admin;
alter table public.urls                               owner to premiser_admin;
alter table public.user_auth                          owner to premiser_admin;
alter table public.user_auth_tokens                   owner to premiser_admin;
alter table public.user_external_ids                  owner to premiser_admin;
alter table public.user_groups                        owner to premiser_admin;
alter table public.user_permissions                   owner to premiser_admin;
alter table public.users                              owner to premiser_admin;
alter table public.writ_quote_urls                    owner to premiser_admin;
alter table public.writ_quotes                        owner to premiser_admin;
alter table public.writs                              owner to premiser_admin;
