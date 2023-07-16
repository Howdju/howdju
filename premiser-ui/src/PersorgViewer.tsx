import React from "react";
import cn from "classnames";
import { PersorgOut } from "howdju-common";
import { ComponentId } from "./types";

interface Props {
  id: ComponentId;
  persorg?: PersorgOut;
  className?: string;
}

export default function PersorgViewer({
  id,
  persorg,
  className,
  ...rest
}: Props) {
  if (!persorg) {
    return null;
  }
  const {
    name,
    isOrganization,
    knownFor,
    created,
    websiteUrl,
    wikipediaUrl,
    twitterUrl,
  } = persorg;
  return (
    <div {...rest} id={id} className={cn(className, "persorg-viewer")}>
      {persorg && (
        <div className="persorg-viewer">
          <div className="persorg-name">{name}</div>
          {!isOrganization && (
            <div className="persorg-known-for">{knownFor}</div>
          )}
          <div className="persorg-created">Created: {created}</div>
          {websiteUrl && (
            <a className="persorg-website-url" href={websiteUrl}>
              {websiteUrl}
            </a>
          )}
          {wikipediaUrl && (
            <a className="persorg-wikipedia-url" href={wikipediaUrl}>
              {wikipediaUrl}
            </a>
          )}
          {twitterUrl && (
            <a className="persorg-twitter-url" href={twitterUrl}>
              {twitterUrl}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
