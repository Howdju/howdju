import React from 'react'
import StatementEditor from "./StatementEditor";
import CitationReferenceEditor from "./CitationReferenceEditor";
import {isStatementBased} from "./models";

export default props => {
  const {
    justification,
    editBasis,
    onPropertyChange,
  } = props
  return (
      isStatementBased(justification) ?
          <StatementEditor statement={editBasis}
                           onPropertyChange={onPropertyChange}
          /> :
          <CitationReferenceEditor citationReference={editBasis}
                                   onPropertyChange={onPropertyChange}
          />
  )
}