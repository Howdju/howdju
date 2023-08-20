update persorgs set known_for = '' where known_for is null;
update persorgs set normal_known_for = '' where normal_known_for = null;
alter table persorgs alter column known_for set not null;
alter table persorgs alter column normal_known_for set not null;

create type appearance_vote_polarity as enum ('POSITIVE', 'NEGATIVE');

-- Records that users have confirmed an appearance.
--
-- Users confirm an appearance by:
-- * Creating (or duplicating) the appearance.
-- * Adding a pro-justification for the appearance.
create table appearance_confirmations (
  appearance_id bigint not null references appearances(appearance_id),
  user_id bigint not null references users(user_id),
  polarity appearance_vote_polarity not null,

  created timestamp not null,
  deleted timestamp,

  primary key(appearance_id, user_id)
);
