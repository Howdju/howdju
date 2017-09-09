import React, {Component} from 'react'
import {
  isWritingQuoteBased,
  isStatementCompoundBased,
  newImpossibleError,
} from "howdju-common"
import StatementCompoundViewer from "./StatementCompoundViewer"
import WritingQuoteViewer from "./WritingQuoteViewer"
import ExpandableChildContainer from './ExpandableChildContainer'

export default class JustificationBasisViewer extends Component {

  render() {
    const {
      id,
      justification,
      doShowControls,
      doShowBasisJustifications,
      ...rest,
    } = this.props
    const basis = justification.basis.entity

    if (isStatementCompoundBased(justification)) {
      return <StatementCompoundViewer {...rest}
                                      id={id}
                                      statementCompound={basis}
                                      doShowControls={doShowControls}
                                      doShowStatementAtomJustifications={doShowBasisJustifications}
      />
    }
    if (isWritingQuoteBased(justification)) {
      return (
        <ExpandableChildContainer {...rest}
                                  ExpandableChildComponent={WritingQuoteViewer}
                                  widgetId={id}
                                  id={id}
                                  key={id}
                                  writingQuote={basis}
                                  doShowControls={doShowControls}
        />
      )
    }
    throw newImpossibleError(`Exhausted JustificationBasisTypes: ${justification.basis.type}`)
  }
}
