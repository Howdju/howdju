import get from 'lodash/get'
import isEqual from 'lodash/isEqual'
import map from 'lodash/map'
import React from 'react'
import {connect} from 'react-redux'
import {denormalize} from 'normalizr'
import Helmet from './Helmet'
import {FontIcon, ListItem, MenuButton} from 'react-md'

import {
  api,
  editors,
  mapActionCreatorGroupToDispatchToProps,
} from "./actions"
import CellList from './CellList'
import * as characters from './characters'
import {persorgSchema, statementsSchema} from './normalizationSchemas'
import {EditorTypes} from "./reducers/editors"
import PersorgEntityCard from './PersorgEntityCard'
import StatementCard from './StatementCard'
import {
  combineIds,
  combineSuggestionsKeys,
} from './viewModels'


class PersorgPage extends React.Component {

  static id = 'persorg-page'
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
    this.props.api.fetchSpeakerStatements(persorgId)
  }

  editPersorg = () => {
    this.props.editors.beginEdit(EditorTypes.PERSORG, combineIds(PersorgPage.editorId, 'persorg'), this.props.persorg)
  }

  render() {
    const {
      persorg,
      statements,
    } = this.props

    const persorgName = get(persorg, 'name', characters.ellipsis)
    const title = `${persorgName}`

    const statementCards = map(statements, (statement, index) =>
      <StatementCard
        id={combineIds(PersorgPage.id, 'statements', index)}
        className={CellList.largeCellClasses}
        key={index}
        statement={statement}
      />
    )

    const menu = (
      <MenuButton
        icon
        id={combineIds(PersorgPage.id, 'menu')}
        menuClassName="context-menu"
        children={'more_vert'}
        position={MenuButton.Positions.TOP_RIGHT}
        menuItems={[
          <ListItem
            primaryText="Edit"
            key="edit"
            leftIcon={<FontIcon>edit</FontIcon>}
            onClick={this.editPersorg}
          />
        ]}
      />
    )

    return (
      <div id={PersorgPage.id} className="md-grid">
        <Helmet>
          <title>{title} — Howdju</title>
        </Helmet>
        <h1 className="md-cell md-cell--12">{title}</h1>
        <PersorgEntityCard
          id={combineIds(PersorgPage.id, 'persorg')}
          editorId={combineIds(PersorgPage.editorId, 'persorg')}
          className="md-cell md-cell--12"
          persorg={persorg}
          menu={menu}
          suggestionKeys={combineSuggestionsKeys(PersorgPage.id, 'persorg')}
        />
        <h2 className="md-cell md-cell--12">Statements</h2>
        <CellList className="md-grid md-cell md-cell--12 md-grid--card-list--tablet">{statementCards}</CellList>
      </div>
    )
  }
}

function getPersorgId(props) {
  return props.match.params.persorgId
}

function mapStateToProps(state, ownProps) {
  const persorgId = getPersorgId(ownProps)
  const persorg = denormalize(persorgId, persorgSchema, state.entities)
  const {statements: statementIds, isFetching} = state.ui.persorgPage
  const statements = denormalize(statementIds, statementsSchema, state.entities)
  return {
    persorg,
    statements,
    isFetching,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  api,
  editors,
}))(PersorgPage)
