export function makeRecentActivityUrl(urlAuthority: string) {
  return makeUrl(urlAuthority, "/recent-activity/").href;
}

export function makeUrl(urlAuthority: string, path: string) {
  return new URL(
    urlAuthority.replace(/\/$/, "") + "/" + path.replace(/^\//, "")
  );
}
