import React, { Component } from "react";
import { Paper } from "react-md";

import { JustificationBasisTypes, newExhaustedEnumError } from "howdju-common";

import PropositionCompoundViewer from "./PropositionCompoundViewer";
import WritQuoteEntityViewer from "./WritQuoteEntityViewer";

import "./JustificationBasisViewer.scss";

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
    } = this.props;
    const basis = justification.basis;

    switch (basis.type) {
      case JustificationBasisTypes.PROPOSITION_COMPOUND:
        return (
          <PropositionCompoundViewer
            {...rest}
            id={id}
            propositionCompound={basis.entity}
            doShowControls={doShowControls}
            doShowAtomJustifications={doShowBasisJustifications}
            isCondensed={isCondensed}
            isUnCondensed={isUnCondensed}
            showBasisUrls={showUrls}
            showStatusText={showStatusText}
            contextTrailItems={contextTrailItems}
          />
        );
      case JustificationBasisTypes.WRIT_QUOTE:
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
        );
      default:
        throw newExhaustedEnumError(basis.type);
    }
  }
}
