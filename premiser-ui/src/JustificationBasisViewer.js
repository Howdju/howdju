import React, {Component} from 'react'
import {
  JustificationBasisType,
  newExhaustedEnumError,
} from "howdju-common"
import StatementCompoundViewer from "./StatementCompoundViewer"
import WritQuoteViewer from "./WritQuoteViewer"
import ExpandableChildContainer from './ExpandableChildContainer'
import JustificationBasisCompoundViewer from "./JustificationBasisCompoundViewer"

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

    switch (basis.type) {
      case JustificationBasisType.STATEMENT_COMPOUND:
        return (
          <StatementCompoundViewer {...rest}
                                   id={id}
                                   statementCompound={basis}
                                   doShowControls={doShowControls}
                                   doShowStatementAtomJustifications={doShowBasisJustifications}
          />
        )
      case JustificationBasisType.WRIT_QUOTE:
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
      case JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND:
        return (
          <JustificationBasisCompoundViewer {...rest}
                                            id={id}
                                            justificationBasisCompound={basis}
                                            doShowControls={doShowControls}
                                            doShowStatementAtomJustifications={doShowBasisJustifications}
          />
        )
      default:
        throw newExhaustedEnumError('JustificationBasisType', basis.type)
    }
  }
}
