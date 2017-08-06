import React, {Component} from 'react'
import {isCitationReferenceBased, isStatementCompoundBased} from "./models";
import StatementCompoundViewer from "./StatementCompoundViewer";
import CitationReferenceViewer from "./CitationReferenceViewer";
import {newImpossibleError} from "./customErrors";

export default class JustificationBasisViewer extends Component {

  render() {
    const {
      justification,
      doShowControls,
      doShowBasisJustifications,
      ...rest,
    } = this.props
    const basis = justification.basis.entity

    if (isStatementCompoundBased(justification)) {
      return <StatementCompoundViewer {...rest}
                                      statementCompound={basis}
                                      doShowControls={doShowControls}
                                      doShowStatementAtomJustifications={doShowBasisJustifications}
      />
    }
    if (isCitationReferenceBased(justification)) {
      return <CitationReferenceViewer {...rest}
                                      doShowControls={doShowControls}
                                      citationReference={basis}
      />
    }
    throw newImpossibleError(`Exhausted JustificationBasisTypes: ${justification.basis.type}`)
  }
}
