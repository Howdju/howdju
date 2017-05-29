import React from 'react'
import StatementViewer from "./StatementViewer";
import CitationReferenceViewer from "./CitationReferenceViewer";
import {isStatementBased} from "./models";

export default props => {
  const {justification} = props
  const basisEntity = justification.basis.entity
  return (
      isStatementBased(justification) ?
          <StatementViewer statement={basisEntity} /> :
          <CitationReferenceViewer citationReference={basisEntity} />
  )
}