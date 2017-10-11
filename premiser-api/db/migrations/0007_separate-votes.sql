alter table votes rename target_id to justification_id;
alter table votes drop column target_type;
alter table votes rename column vote_id to justification_vote_id;
alter table votes rename to justification_votes;

create table if not exists statement_tag_votes (
  statement_tag_vote_id serial,
  user_id integer,
  statement_id integer,
  tag_id integer,
  polarity varchar(32), -- POSITIVE, NEGATIVE
  created timestamp,
  deleted timestamp
);

alter table tags rename column text to name;
alter table tags add column normal_name varchar(1024);

alter table tagging_scores rename column tagging_id to statement_tag_score_id;
alter table tagging_scores add column statement_id integer;
alter table tagging_scores add column tag_id integer;
alter table tagging_scores rename to statement_tag_scores;