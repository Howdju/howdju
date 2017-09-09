import React, {Component} from 'react'
import {
  isWritQuoteBased,
  isStatementCompoundBased,
  newImpossibleError,
} from "howdju-common"
import StatementCompoundViewer from "./StatementCompoundViewer"
import WritQuoteViewer from "./WritQuoteViewer"
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
    if (isWritQuoteBased(justification)) {
      return (
        <ExpandableChildContainer {...rest}
                                  ExpandableChildComponent={WritQuoteViewer}
                                  widgetId={id}
                                  id={id}
                                  key={id}
                                  writQuote={basis}
                                  doShowControls={doShowControls}
        />
      )
    }
    throw newImpossibleError(`Exhausted JustificationBasisTypes: ${justification.basis.type}`)
  }
}
