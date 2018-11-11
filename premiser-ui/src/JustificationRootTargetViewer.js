import React from 'react'

import {JustificationRootTargetType, newExhaustedEnumError} from 'howdju-common'

import PropositionEntityViewer from './PropositionEntityViewer'
import StatementEntityViewer from './StatementEntityViewer'

export default function JustificationRootTargetViewer(props) {
  const {
    id,
    rootTargetType,
    rootTarget,
    suggestionsKey,
    menu,
  } = props
  switch (rootTargetType) {
    case JustificationRootTargetType.PROPOSITION:
      return (
        <PropositionEntityViewer
          id={id}
          proposition={rootTarget}
          suggestionsKey={suggestionsKey}
          showStatusText={false}
          menu={menu}
        />
      )
    case JustificationRootTargetType.STATEMENT:
      return (
        <StatementEntityViewer
          id={id}
          statement={rootTarget}
          suggestionsKey={suggestionsKey}
          showStatusText={false}
          menu={menu}
        />
      )
    default:
      throw newExhaustedEnumError('JustificationRootTargetType', rootTargetType)
  }
}