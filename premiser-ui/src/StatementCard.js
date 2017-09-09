import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import Card from 'react-md/lib/Cards/Card'
import CardTitle from 'react-md/lib/Cards/CardTitle'
import FontIcon from 'react-md/lib/FontIcons'
import Button from 'react-md/lib/Buttons/Button'
import moment from 'moment'

import paths from './paths'
import config from './config'
import {truncateStatementText, isTextLong} from './viewModels'
import t from './texts'
import * as characters from './characters'

export default class StatementCard extends Component {

  render () {
    const {
      statement,
      isExpanded,
      onExpand,
      onCollapse,
      ...rest,
    } = this.props
    const age = statement.created ? moment(statement.created).fromNow() : ''
    // const age = moment.duration(moment(s.created).diff(now)).humanize(true)
    const created = statement.created ? moment(statement.created).format(config.humanDateTimeFormat) : ''
    const _isTextLong = isTextLong(statement.text)
    const text = !_isTextLong || isExpanded ? statement.text : truncateStatementText(statement.text, {omission: ''})
    return (
      <Card {...rest}>
        <CardTitle
          avatar={<FontIcon role="presentation">short_text</FontIcon>}
          title={
            <span>
              <Link to={paths.statement(statement)}>
                {text}
              </Link>
              {_isTextLong && !isExpanded && (
                <span className="clickable" onClick={onExpand}>{characters.ellipsis}</span>
              )}
              {_isTextLong && ' '}
              {_isTextLong && !isExpanded && (
                <Button flat
                        label={t('More')}
                        className="text-expand-toggle"
                        onClick={onExpand}
                />
              )}
              {_isTextLong && isExpanded && (
                <Button flat
                        label={t('Less')}
                        className="text-expand-toggle"
                        onClick={onCollapse}
                />
              )}
            </span>
          }
          subtitle={
            <span className="recent-statement-status-text">
              created <span title={created}>{age}</span>
            </span>
          }
        />
      </Card>
    )
  }
}
StatementCard.propTypes = {
  statement: PropTypes.object.isRequired,
}
