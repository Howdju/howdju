import React, {Component} from 'react'
import {
  isCitationReferenceBased,
  isStatementCompoundBased,
  newImpossibleError,
} from "howdju-common";
import StatementCompoundViewer from "./StatementCompoundViewer";
import CitationReferenceViewer from "./CitationReferenceViewer";
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
    if (isCitationReferenceBased(justification)) {
      return (
          <ExpandableChildContainer {...rest}
                                    ExpandableChildComponent={CitationReferenceViewer}
                                    widgetId={id}
                                    id={id}
                                    key={id}
                                    citationReference={basis}
                                    doShowControls={doShowControls}
          />
      )
    }
    throw newImpossibleError(`Exhausted JustificationBasisTypes: ${justification.basis.type}`)
  }
}
