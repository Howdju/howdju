import React, {Component} from 'react'
import {Link} from 'react-router-dom'
import PropTypes from 'prop-types'
import get from 'lodash/get'
import moment from 'moment'

import {
  SentenceType,
} from 'howdju-common'

import config from './config'
import JustificationCountViewer from './JustificationCountViewer'
import paths from './paths'
import PropositionEntityViewer from './PropositionEntityViewer'
import {combineIds} from './viewModels'

import './StatementEntityViewer.scss'
import EntityViewer from './EntityViewer'

export default class StatementEntityViewer extends Component {

  static propTypes = {
    id: PropTypes.string.isRequired,
  }

  static defaultProps ={
    showStatusText: true,
    showJustificationCount: true,
    component: 'div',
  }

  render() {
    const {
      component,
      id,
      className,
      statement,
      menu,
      showStatusText,
      showJustificationCount,
    } = this.props

    let entityStatusText
    if (statement && showStatusText) {
      const age = statement.created ? moment(statement.created).fromNow() : ''
      const created = statement.created ? moment(statement.created).format(config.humanDateTimeFormat) : ''
      const modifiedAge = statement.modified ? moment(statement.modified).fromNow() : ''
      const modified = statement.modified ? moment(statement.modified).format(config.humanDateTimeFormat) : ''
      const creatorName = get(statement, 'creator.longName')
      const creatorNameDescription = creatorName && ` by ${creatorName}` || ''

      const modifiedTitle = <span title={modified}>{modifiedAge}</span>
      const modifiedSpan = (<span>(modified {modifiedTitle})</span>)
      const modifiedDescription = modified && modifiedSpan
      entityStatusText = (
        <span className="entity-status-text">
          created{creatorNameDescription} {modifiedDescription} <span title={created}>{age}</span>
        </span>
      )
    }

    let speakerStuff
    if (statement) {
      speakerStuff =
        <div className="statement-entity-header">
          <Link
            to={paths.persorg(statement.speaker)}
            className="speaker-name"
          >
            {statement.speaker.name}
          </Link>
          <Link to={paths.statement(statement)}>
            said that
            {showJustificationCount && statement.rootJustificationCountByPolarity && (
              <JustificationCountViewer justificationCountByPolarity={statement.rootJustificationCountByPolarity}/>
            )}
          </Link>
        </div>
    }

    let entity
    if (!statement) {
      entity = null
    } else if (statement.sentenceType === SentenceType.STATEMENT) {
      entity =
        <StatementEntityViewer
          id={combineIds(id, 'statement')}
          statement={statement.sentence}
          showStatusText={false}
          showJustificationCount={showJustificationCount}
        />
    } else {
      entity =
        <PropositionEntityViewer
          id={combineIds(id, 'proposition')}
          proposition={statement.sentence}
          showStatusText={false}
          showJustificationCount={showJustificationCount}
        />
    }

    const speakerAndSentence =
      <div className="sentence-entity-wrapper">
        {speakerStuff}
        {entity}
      </div>

    return (
      <div>
        <EntityViewer
          iconName="message"
          iconLink={statement && paths.statement(statement)}
          className={className}
          iconTitle="Statement"
          component={component}
          entity={speakerAndSentence}
          menu={menu}
        />
        {entityStatusText}
      </div>
    )
  }
}
