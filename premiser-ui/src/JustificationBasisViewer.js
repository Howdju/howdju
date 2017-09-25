import React, {Component} from 'react'
import {
  JustificationBasisType,
  newExhaustedEnumError,
} from "howdju-common"
import StatementCompoundViewer from "./StatementCompoundViewer"
import WritQuoteViewer from "./WritQuoteViewer"
import ExpandableChildContainer from './ExpandableChildContainer'
import JustificationBasisCompoundViewer from "./JustificationBasisCompoundViewer"

import './JustificationBasisViewer.scss'


export default class JustificationBasisViewer extends Component {

  render() {
    const {
      id,
      justification,
      doShowControls,
      doShowBasisJustifications,
      ...rest,
    } = this.props
    const basis = justification.basis

    switch (basis.type) {
      case JustificationBasisType.STATEMENT_COMPOUND:
        return (
          <StatementCompoundViewer {...rest}
                                   id={id}
                                   statementCompound={basis.entity}
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
                                    writQuote={basis.entity}
                                    doShowControls={doShowControls}
          />
        )
      case JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND:
        return (
          <JustificationBasisCompoundViewer {...rest}
                                            id={id}
                                            justificationBasisCompound={basis.entity}
                                            doShowControls={doShowControls}
                                            doShowStatementAtomJustifications={doShowBasisJustifications}
          />
        )
      default:
        throw newExhaustedEnumError('JustificationBasisType', basis.type)
    }
  }
}
