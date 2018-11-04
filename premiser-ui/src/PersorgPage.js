import get from 'lodash/get'
import isEqual from 'lodash/isEqual'
import React from 'react'
import {connect} from 'react-redux'

import {
  api,
  ui,
  mapActionCreatorGroupToDispatchToProps,
} from "./actions"
import {denormalize} from 'normalizr'
import {propositionsSchema, tagSchema} from './normalizationSchemas'
import * as characters from './characters'
import Helmet from 'react-helmet'
import EditablePersorg from './EditablePersorg'


class PersorgPage extends React.Component {

  static editorId = 'persorgPageEditorId'
  static suggestionsKey = 'persorgPageSuggestionsKey'

  componentDidMount() {
    const persorgId = getPersorgId(this.props)
    this.refresh(persorgId)
  }

  componentDidUpdate(prevProps) {
    const prevPersorgId = getPersorgId(prevProps)
    const persorgId = getPersorgId(this.props)
    if (!isEqual(prevPersorgId, persorgId)) {
      this.refresh(persorgId)
    }
  }

  refresh = (persorgId) => {
    this.props.api.fetchPersorg(persorgId)
  }

  render() {
    const {
      persorg,
    } = this.props

    const persorgName = get(persorg, 'name', characters.ellipsis)
    const title = `${persorgName} — Howdju`

    return (
      <div id="persorg-page" className="md-grid">
        <Helmet>
          <title>{title} — Howdju</title>
        </Helmet>
        <div className="md-cell--12">
          <h1>{title}</h1>
        </div>
        <EditablePersorg
          id="persorg-page-editor"
          persorg={persorg}
          editorId={PersorgPage.editorId}
          suggestionsKey={PersorgPage.suggestionsKey}
        />
      </div>
    )
  }
}

function getPersorgId(props) {
  return props.match.params.persorgId
}

function mapStateToProps(state, ownProps) {
  const persorgId = getPersorgId(ownProps)
  const tag = denormalize(state.entities.tags[persorgId], tagSchema, state.entities)
  const {propositions: propositionIds, isFetching} = state.ui.tagPage
  const propositions = denormalize(propositionIds, propositionsSchema, state.entities)
  return {
    tag,
    propositions,
    isFetching,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  api,
  ui,
}))(PersorgPage)
