import classNames from 'classnames'
import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { denormalize } from 'normalizr'
import DocumentTitle from 'react-document-title'
import Divider from 'react-md/lib/Dividers'
import Card from 'react-md/lib/Cards/Card'
import CardActions from 'react-md/lib/Cards/CardActions'
import CardTitle from 'react-md/lib/Cards/CardTitle'
import Button from 'react-md/lib/Buttons'
import FontIcon from 'react-md/lib/FontIcons'
import CircularProgress from 'react-md/lib/Progress/CircularProgress'
import MenuButton from 'react-md/lib/Menus/MenuButton'
import ListItem from 'react-md/lib/Lists/ListItem'
import Positions from 'react-md/lib/Menus/Positions'
import groupBy from 'lodash/groupBy'
import filter from 'lodash/filter'
import sortBy from 'lodash/sortBy'
import toNumber from 'lodash/toNumber'
import isFinite from 'lodash/isFinite'


import {extractDomain, logError} from './util'
import { JustificationTargetType, JustificationPolarity, JustificationBasisType} from './models'
import './StatementJustificationsPage.scss'
import {acceptJustification, rejectJustification, fetchStatementJustifications} from "./actions"
import {statementSchema, justificationSchema} from "./schemas"

class CounterJustifications extends Component {
  render() {
    const {counterJustifications} = this.props
    if (counterJustifications && counterJustifications.length > 0) {
      return (
          <div className="counterJustifications">
            {counterJustifications.map(j => <Justification key={j.id} withCounterJustifications justification={j} />)}
          </div>
      )
    }
    return null
  }
}

class Justification extends Component {
  constructor() {
    super()
    this.state = {isOver: false}
    this.onCardMouseOver = this.onCardMouseOver.bind(this)
    this.onCardMouseLeave = this.onCardMouseLeave.bind(this)
  }

  onCardMouseOver() {
    this.setState({isOver: true})
  }

  onCardMouseLeave() {
    this.setState({isOver: false})
  }

  render() {
    const {justification, withCounterJustifications} = this.props
    const isPositive = justification.polarity === JustificationPolarity.POSITIVE
    const isNegative = justification.polarity === JustificationPolarity.NEGATIVE
    const {isOver} = this.state
    const justificationClasses = classNames({
      justification: true,
      positive: isPositive,
      negative: isNegative
    })
    const justificationTextClasses = classNames({
      justificationText: true,
      quote: justification.basis.type === JustificationBasisType.REFERENCE,
    })
    const text = justification.basis.type === JustificationBasisType.STATEMENT ? justification.basis.entity.text : justification.basis.entity.quote
    const menu = (
        <MenuButton
            icon
            id={`justification-${justification.id}-context-menu`}
            buttonChildren={isOver ? 'more_vert' : 'empty'}
            position={Positions.TOP_RIGHT}
        >
          <ListItem primaryText="Counter" leftIcon={<FontIcon>reply</FontIcon>} />
          <ListItem primaryText="Use" leftIcon={<FontIcon>call_made</FontIcon>} />
          <Divider />
          <ListItem primaryText="Edit" leftIcon={<FontIcon>create</FontIcon>} />
          <ListItem primaryText="Delete" leftIcon={<FontIcon>delete</FontIcon>} />
        </MenuButton>
    )
    return (
        <div className={justificationClasses}>
          <Card className="card"
                onMouseOver={this.onCardMouseOver}
                onMouseLeave={this.onCardMouseLeave}
          >

            <div className="md-grid">
              <div className="md-cell md-cell--11">

                <div>
                  <div className={justificationTextClasses}>
                    <span>{text}</span>
                  </div>
                  {justification.basis.type === JustificationBasisType.REFERENCE &&
                    <ul>
                      {justification.basis.entity.urls.map(u => <a key={u.id} href={u.url}>{extractDomain(u.url)}</a>)}
                    </ul>
                  }
                </div>

              </div>
              <div className="md-cell md-cell--1 md-cell--right">
                {menu}
              </div>
            </div>

            <CardActions className="actions">
              <Button icon title="Confirm this justification">thumb_up</Button>
              <Button icon title="Dis-confirm this justification">thumb_down</Button>
              <Button icon className={classNames({hidden: !isOver})} title="Counter this justification">reply</Button>
            </CardActions>
          </Card>
          {withCounterJustifications && <CounterJustifications counterJustifications={justification.counterJustifications} />}
        </div>
    )
  }
}

class StatementJustificationsPage extends Component {
  constructor() {
    super()
    this.state = {isOverStatement: false}
    this.onStatementMouseOver = this.onStatementMouseOver.bind(this)
    this.onStatementMouseLeave = this.onStatementMouseLeave.bind(this)
  }

  onStatementMouseOver() {
    this.setState({isOverStatement: true})
  }

  onStatementMouseLeave() {
    this.setState({isOverStatement: false})
  }

  componentWillMount() {
    this.props.fetchStatementJustifications(this.props.match.params.statementId)
  }

  render () {
    const {
      statement,
      hasJustifications,
      justificationsByPolarity,
      isFetching
    } = this.props
    const menu = (
        <MenuButton
            icon
            id={`statement-context-menu`}
            buttonChildren={this.state.isOverStatement ? 'more_vert' : 'empty'}
            position={Positions.TOP_RIGHT}
        >
          <ListItem primaryText="Use" leftIcon={<FontIcon>call_made</FontIcon>} />
          <Divider />
          <ListItem primaryText="Edit" leftIcon={<FontIcon>create</FontIcon>} />
          <ListItem primaryText="Delete" leftIcon={<FontIcon>delete</FontIcon>} />
        </MenuButton>
    )
    return (
        <DocumentTitle title={`${statement ? statement.text : 'Loading statement'} - Howdju`}>
          <div className="statement-justifications">

            <div className="md-grid">
              <div className="md-cell md-cell--12">

                <div className="statement">

                  <Card
                      onMouseOver={this.onStatementMouseOver}
                      onMouseLeave={this.onStatementMouseLeave}
                  >

                    <div className="md-grid">
                      <div className="md-cell md-cell--11">

                        {statement ?
                            statement.text :
                            isFetching ?
                                <CircularProgress id="fetchingStatementProgress" /> :
                                ''
                        }

                      </div>
                      <div className="md-cell md-cell--1 md-cell--right">
                        {menu}
                      </div>
                    </div>

                  </Card>

                </div>

              </div>

              {hasJustifications ? (() => [
                    <div key="positive-justifications" className="md-cell md-cell--6">

                      {justificationsByPolarity[JustificationPolarity.POSITIVE].map(j => (
                          <Justification withCounterJustifications key={j.id} justification={j}/>
                      ))}

                    </div>,
                    <div key="negative-justifications" className="md-cell md-cell--6">

                      {justificationsByPolarity[JustificationPolarity.NEGATIVE].map(j => (
                          <Justification withCounterJustifications key={j.id} justification={j}/>
                      ))}

                    </div>
              ])() :
                  <div className="md-cell md-cell--12">
                    {isFetching ?
                        // Only show progress if we are not also showing one for the statement
                        !!statement && <CircularProgress id="fetchingJustificationsProgress"/> :
                        'No justifications'
                    }
                  </div>
              }

            </div>

          </div>
        </DocumentTitle>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const statementId = toNumber(ownProps.match.params.statementId)
  if (!statementId) {
    logError('Missing required statementId')
    return {}
  }
  if (!isFinite(statementId)) {
    logError(`Invalid statementId: ${ownProps.match.params.statementId}`)
    return {}
  }

  let {isFetching, errorMessage} = state.ui.statementJustificationsPage
  const statement = state.entities.statements[statementId]
  if (!statement && !isFetching) {
    // The component may just be mounting
    return {}
  }

  const justifiesStatement = j =>
    j.target.type === JustificationTargetType.STATEMENT &&
    j.target.entity.id === statementId

  // TODO this may get inefficient; we should probably store the justifications by statement ID somewhere in the state
  let justifications = filter(state.entities.justifications, justifiesStatement)
  justifications = sortBy(justifications, j => j.score)
  const hasJustifications = justifications.length > 0
  const justificationsByPolarity = groupBy(justifications, j => j.polarity)
  const statementJustifications = {
    statement,
    justificationsByPolarity,
  }
  const denormalizedStatementJustifications = denormalize(statementJustifications, {
    statement: statementSchema,
    justificationsByPolarity: {
      [JustificationPolarity.POSITIVE]: [justificationSchema],
      [JustificationPolarity.NEGATIVE]: [justificationSchema],
    }
  }, state.entities)
  return {
    isFetching,
    errorMessage,
    hasJustifications,
    ...denormalizedStatementJustifications,
  }
}

StatementJustificationsPage.defaultProps = {
  isFetching: false,
  errorMessage: '',
  hasJustifications: false,
  statement: null,
  justificationsByPolarity: {
    [JustificationPolarity.POSITIVE]: [],
    [JustificationPolarity.NEGATIVE]: [],
  }
}

export default connect(mapStateToProps, {
  fetchStatementJustifications,
  acceptJustification,
  rejectJustification,
})(StatementJustificationsPage)