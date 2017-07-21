import React, {Component} from 'react'
import {isStatementCompoundBased} from "./models";
import StatementCompoundViewer from "./StatementCompoundViewer";
import CitationReferenceViewer from "./CitationReferenceViewer";

class JustificationBasisViewer extends Component {

  render() {
    const {
      justification,
      ...rest,
    } = this.props
    const basis = justification.basis.entity

    return isStatementCompoundBased(justification) ?
        <StatementCompoundViewer {...rest} statementCompound={basis} /> :
        <CitationReferenceViewer {...rest} citationReference={basis} />
  }
}

export default JustificationBasisViewer