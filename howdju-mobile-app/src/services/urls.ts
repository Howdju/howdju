export function makeRecentActivityUrl(urlAuthority: string) {
  const url = new URL(urlAuthority.replace(/\/$/, "") + "/recent-activity/");
  return url.href;
}
