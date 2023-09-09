export default function EmailAddress({username, domain = "howdju.com"}) {
  return <a href={`mailto:${username}@${domain}`}>{username}@{domain}</a>;
}
