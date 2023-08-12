create table appearances (
  appearance_id serial not null primary key,

  media_excerpt_id bigint not null references media_excerpts(media_excerpt_id),
  -- later we can allow this to be null, add other appearing entity types, and add a check that
  -- exactly one of them is non-null.
  proposition_id bigint not null references propositions(proposition_id),

  created timestamp not null,
  creator_user_id bigint not null references users(user_id),
  deleted timestamp
);
