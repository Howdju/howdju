import React, {Component} from 'react'
import Paper from 'react-md/lib/Papers/Paper'

import {
  JustificationBasisType,
  newExhaustedEnumError,
} from "howdju-common"

import StatementCompoundViewer from "./StatementCompoundViewer"
import WritQuoteEntityViewer from "./WritQuoteEntityViewer"
import JustificationBasisCompoundViewer from "./JustificationBasisCompoundViewer"

import './JustificationBasisViewer.scss'


export default class JustificationBasisViewer extends Component {

  render() {
    const {
      id,
      justification,
      doShowControls,
      doShowBasisJustifications,
      showStatusText,
      isCondensed,
      isUnCondensed,
      showUrls,
      ...rest,
    } = this.props
    const basis = justification.basis

    switch (basis.type) {
      case JustificationBasisType.STATEMENT_COMPOUND:
        return (
          <StatementCompoundViewer
            {...rest}
            id={id}
            statementCompound={basis.entity}
            doShowControls={doShowControls}
            doShowStatementAtomJustifications={doShowBasisJustifications}
            isCondensed={isCondensed}
            isUnCondensed={isUnCondensed}
            showBasisUrls={showUrls}
          />
        )
      case JustificationBasisType.WRIT_QUOTE:
        return (
          <WritQuoteEntityViewer
            {...rest}
            component={Paper}
            id={id}
            writQuote={basis.entity}
            doShowControls={doShowControls}
            showUrls={showUrls}
          />
        )
      case JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND:
        return (
          <JustificationBasisCompoundViewer
            {...rest}
            id={id}
            justificationBasisCompound={basis.entity}
            doShowControls={doShowControls}
            doShowStatementAtomJustifications={doShowBasisJustifications}
            showStatusText={showStatusText}
            isCondensed={isCondensed}
            isUnCondensed={isUnCondensed}
            showUrls={showUrls}
          />
        )
      default:
        throw newExhaustedEnumError('JustificationBasisType', basis.type)
    }
  }
}
