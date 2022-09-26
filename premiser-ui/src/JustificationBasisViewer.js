import React, {Component} from 'react'
import {Paper} from 'react-md'

import {
  JustificationBasisType,
  newExhaustedEnumError,
} from "howdju-common"

import PropositionCompoundViewer from "./PropositionCompoundViewer"
import WritQuoteEntityViewer from "./WritQuoteEntityViewer"
import JustificationBasisCompoundViewer from "./JustificationBasisCompoundViewer"

import './JustificationBasisViewer.scss'


export default class JustificationBasisViewer extends Component {

  render() {
    const {
      id,
      justification,
      writQuoteEditorId,
      doShowControls,
      doShowBasisJustifications,
      showStatusText,
      isCondensed,
      isUnCondensed,
      showUrls,
      contextTrailItems,
      onClickWritQuoteUrl,
      ...rest
    } = this.props
    const basis = justification.basis

    switch (basis.type) {
      case JustificationBasisType.PROPOSITION_COMPOUND:
        return (
          <PropositionCompoundViewer
            {...rest}
            id={id}
            propositionCompound={basis.entity}
            doShowControls={doShowControls}
            doShowPropositionAtomJustifications={doShowBasisJustifications}
            isCondensed={isCondensed}
            isUnCondensed={isUnCondensed}
            showBasisUrls={showUrls}
            showStatusText={showStatusText}
            contextTrailItems={contextTrailItems}
          />
        )
      case JustificationBasisType.WRIT_QUOTE:
        return (
          <WritQuoteEntityViewer
            {...rest}
            component={Paper}
            id={id}
            writQuote={basis.entity}
            editorId={writQuoteEditorId}
            doShowControls={doShowControls}
            showStatusText={showStatusText}
            showUrls={showUrls}
            onClickUrl={onClickWritQuoteUrl}
          />
        )
      case JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND:
        return (
          <JustificationBasisCompoundViewer
            {...rest}
            id={id}
            justificationBasisCompound={basis.entity}
            doShowControls={doShowControls}
            doShowPropositionAtomJustifications={doShowBasisJustifications}
            showStatusText={showStatusText}
            isCondensed={isCondensed}
            isUnCondensed={isUnCondensed}
            showUrls={showUrls}
            contextTrailItems={contextTrailItems}
          />
        )
      default:
        throw newExhaustedEnumError('JustificationBasisType', basis.type)
    }
  }
}
