-- Auth refresh tokens allow a user to obtain an auth token. Clients must keep
-- auth tokens in-memory and never accessible via any shared or global object
-- (I.e. never reachable via JavaScript's `window`.) Clients must
-- persist refresh tokens in the most secure way possible. On web this is a
-- secure, same-origin, same-site, http-only cookie. This prevents JavaScript
-- from accessing the refresh token (XSS) and it prevents CSRF attacks so long
-- as all endpoints with sensitive side-effects require an auth token.
create table auth_refresh_tokens (
  -- A surrogate key for the auth refresh token.
  auth_refresh_token_id bigserial primary key,
  -- The user for whom an auth_refresh_token can get auth tokens.
  user_id bigint references users(user_id) not null,
  -- The auth refresh token. Must be globally unique.
  auth_refresh_token text not null,
  created timestamptz not null,
  expires timestamptz not null,
  deleted timestamptz,
  unique (auth_refresh_token)
);
