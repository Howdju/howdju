import React from 'react'

import {JustificationRootTargetType, newExhaustedEnumError} from 'howdju-common'

import PropositionEntityViewer from './PropositionEntityViewer'
import StatementEntityViewer from './StatementEntityViewer'

export default class JustificationRootTargetViewer extends React.Component {

  static defaultProps = {
    showStatusText: true
  }

  render() {
    const {
      id,
      rootTargetType,
      rootTarget,
      suggestionsKey,
      showStatusText,
      menu,
    } = this.props
    switch (rootTargetType) {
      case JustificationRootTargetType.PROPOSITION:
        return (
          <PropositionEntityViewer
            id={id}
            proposition={rootTarget}
            suggestionsKey={suggestionsKey}
            showStatusText={showStatusText}
            menu={menu}
          />
        )
      case JustificationRootTargetType.STATEMENT:
        return (
          <StatementEntityViewer
            id={id}
            statement={rootTarget}
            suggestionsKey={suggestionsKey}
            showStatusText={showStatusText}
            menu={menu}
          />
        )
      default:
        throw newExhaustedEnumError('JustificationRootTargetType', rootTargetType)
    }
  }
}