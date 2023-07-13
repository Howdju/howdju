import React from "react";

import { UserBlurb as UserBlurb } from "howdju-common";

export function UserBlurbViewer({ user }: { user?: UserBlurb }) {
  return <span>{user?.longName ?? "Unknown User"}</span>;
}
