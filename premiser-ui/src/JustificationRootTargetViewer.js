import React from 'react'

import {JustificationRootTargetTypes, newExhaustedEnumError} from 'howdju-common'

import PropositionEntityViewer from './PropositionEntityViewer'
import StatementEntityViewer from './StatementEntityViewer'

export default class JustificationRootTargetViewer extends React.Component {

  static defaultProps = {
    showStatusText: true,
  }

  render() {
    const {
      id,
      editorId,
      rootTargetType,
      rootTarget,
      suggestionsKey,
      showStatusText,
      menu,
    } = this.props
    switch (rootTargetType) {
      case JustificationRootTargetTypes.PROPOSITION:
        return (
          <PropositionEntityViewer
            id={id}
            editorId={editorId}
            proposition={rootTarget}
            suggestionsKey={suggestionsKey}
            showStatusText={showStatusText}
            menu={menu}
          />
        )
      case JustificationRootTargetTypes.STATEMENT:
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
        throw newExhaustedEnumError(rootTargetType)
    }
  }
}
