import React from 'react'

import {JustificationRootTargetType, newExhaustedEnumError} from 'howdju-common'

import PropositionEntityViewer from './PropositionEntityViewer'
import StatementEntityViewer from './StatementEntityViewer'

export default function JustificationRootTargetViewer(props) {
  switch (props.justification.rootTargetType) {
    case JustificationRootTargetType.PROPOSITION:
      return (
        <PropositionEntityViewer
          id={props.id}
          proposition={props.justification.rootTarget}
          suggestionsKey={props.suggestionsKey}
          showStatusText={false}
        />
      )
    case JustificationRootTargetType.STATEMENT:
      return (
        <StatementEntityViewer
          id={props.id}
          statement={props.justification.rootTarget}
          suggestionsKey={props.suggestionsKey}
          showStatusText={false}
        />
      )
    default:
      throw newExhaustedEnumError('JustificationRootTargetType', props.justification.rootTargetType)
  }
}