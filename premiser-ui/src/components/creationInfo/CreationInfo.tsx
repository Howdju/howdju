import React from "react";
import moment, { Moment } from "moment";

import config from "../../config";

interface Props {
  created: Moment | string;
  creator?: {
    longName?: string;
  };
}

export default function CreationInfo({ created, creator }: Props) {
  const createdMoment = moment(created);
  const age = createdMoment.fromNow();
  const createdDate = createdMoment.format(config.humanDateTimeFormat);
  const creatorName = creator?.longName;
  const creatorNameDescription = creatorName ? ` by ${creatorName}` : "";

  return (
    <div>
      <span className="entity-status-text">
        created{creatorNameDescription} <span title={createdDate}>{age}</span>
      </span>
    </div>
  );
}
