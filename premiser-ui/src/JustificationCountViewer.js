import React from 'react'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'

import {
  JustificationPolarities,
} from 'howdju-common'

export default function JustificationCountViewer(props) {
  const {
    justificationCountByPolarity,
  } = props

  const positiveJustificationCount = get(justificationCountByPolarity, JustificationPolarities.POSITIVE, 0)
  const negativeJustificationCount = get(justificationCountByPolarity, JustificationPolarities.NEGATIVE, 0)
  return isEmpty(justificationCountByPolarity) ? (
    <span title="no justifications">
      (0)
    </span>
  ) : (
    <span title={`${positiveJustificationCount} supporting justifications; ${negativeJustificationCount} opposing justifications`}>
      ({positiveJustificationCount}+/{negativeJustificationCount}-)
    </span>
  )
}
