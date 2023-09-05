import React from "react";
import { get, isEmpty } from "lodash";
import { MaterialSymbol } from "react-material-symbols";

import { JustificationCountMap, JustificationPolarities } from "howdju-common";

export default function JustificationCountViewer(props: {
  justificationCountByPolarity: JustificationCountMap;
}) {
  const { justificationCountByPolarity } = props;

  const positiveJustificationCount = get(
    justificationCountByPolarity,
    JustificationPolarities.POSITIVE,
    0
  );
  const negativeJustificationCount = get(
    justificationCountByPolarity,
    JustificationPolarities.NEGATIVE,
    0
  );
  return isEmpty(justificationCountByPolarity) ? (
    <span title="no justifications">(0)</span>
  ) : (
    <span
      title={`${positiveJustificationCount} supporting justifications; ${negativeJustificationCount} opposing justifications`}
    >
      <MaterialSymbol icon="merge" size={12} />
      {positiveJustificationCount}+/
      {negativeJustificationCount}-
    </span>
  );
}
