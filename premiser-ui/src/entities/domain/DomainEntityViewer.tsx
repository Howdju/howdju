import React from "react";

import { Domain } from "howdju-common";

import EntityViewer from "@/EntityViewer";
import Link from "@/Link";
import paths from "@/paths";

import "./DomainEntityViewer.scss";

interface Props {
  domain: Domain;
}

export default function DomainEntityViewer({ domain: { domain } }: Props) {
  return (
    <EntityViewer
      icon="language"
      iconTitle="Domain"
      entity={
        <Link className="domain-link" to={paths.mainSearch(domain)}>
          {domain}
        </Link>
      }
    />
  );
}
