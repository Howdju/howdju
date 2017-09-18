import React, {Component} from 'react'
import PropTypes from 'prop-types'

import {
  JustificationBasisCompoundAtomType,
  newExhaustedEnumError,
} from 'howdju-common'

import StatementAtomViewer from './StatementAtomViewer'
import SourceExcerptParaphraseAtomViewer from './SourceExcerptParaphraseAtomViewer'

export default class JustificationBasisCompoundAtomViewer extends Component {
  render() {
    const {
      atom,
    } = this.props

    const _baseId = baseId(this.props)
    const _editorId = editorId(_baseId)

    switch (atom.type) {
      case JustificationBasisCompoundAtomType.STATEMENT:
        return (
          <StatementAtomViewer id={_baseId}
                               editorId={_editorId}
                               atom={atom}
          />
        )
      case JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE:
        return (
          <SourceExcerptParaphraseAtomViewer id={_baseId}
                                             paraphrasingStatementEditorId={_editorId + '-paraphrasingStatement'}
                                             sourceExcerptEditorId={_editorId + '-sourceExcerpt'}
                                             atom={atom}
          />
        )
      default:
        throw newExhaustedEnumError('JustificationBasisCompoundAtomType', atom.type)
    }
  }
}
JustificationBasisCompoundAtomViewer.propTypes = {
  id: PropTypes.string.isRequired,
  atom: PropTypes.object.isRequired,
}

function baseId(props) {
  const {
    id,
    atom
  } = props
  const idPrefix = id ? id + '-' : ''
  return `${idPrefix}justificationBasisCompoundAtom-${atom.compoundId}-${atom.entity.id}`
}

function editorId(baseId) {
  return `${baseId}-justificationBasisEditor`
}