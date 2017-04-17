import React, {Component} from "react";
import {connect} from "react-redux";
import {denormalize} from "normalizr";
import DocumentTitle from "react-document-title";
import Divider from "react-md/lib/Dividers";
import Card from "react-md/lib/Cards/Card";
import FontIcon from "react-md/lib/FontIcons";
import CircularProgress from "react-md/lib/Progress/CircularProgress";
import MenuButton from "react-md/lib/Menus/MenuButton";
import ListItem from "react-md/lib/Lists/ListItem";
import Positions from "react-md/lib/Menus/Positions";
import groupBy from "lodash/groupBy";
import sortBy from "lodash/sortBy";
import toNumber from "lodash/toNumber";
import isFinite from "lodash/isFinite";
import forEach from 'lodash/forEach';
import some from 'lodash/some'
import classNames from 'classnames'


import {logError} from "./util";
import {isVerified, isDisverified, JustificationPolarity} from "./models";
import "./StatementJustificationsPage.scss";
import {acceptJustification, fetchStatementJustifications, rejectJustification} from "./actions";
import {justificationSchema, statementSchema} from "./schemas";
import Justification from './Justification'

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
      isFetching,
      hasAgreement,
      hasDisagreement,
    } = this.props
    const statementCardClassNames = classNames({
      agreement: hasAgreement,
      disagreement: hasDisagreement,
    })
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

                  <Card className={statementCardClassNames}
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

const sortJustifications = justifications => {
  justifications = sortBy(justifications, j => j.score)
  justifications = sortBy(justifications, j => isDisverified(j) ? 1 : isVerified(j) ? -1 : 0)
  forEach(justifications, j => {
    j.counterJustifications = sortJustifications(j.counterJustifications)
  })
  return justifications
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

  let justifications = denormalize(state.entities.justificationsByRootStatementId[statementId], [justificationSchema], state.entities)
  justifications = sortJustifications(justifications)

  const hasJustifications = justifications.length > 0
  const justificationsByPolarity = groupBy(justifications, j => j.polarity)
  const hasAgreement = some(justificationsByPolarity[JustificationPolarity.POSITIVE], isVerified)
  const hasDisagreement = some(justificationsByPolarity[JustificationPolarity.NEGATIVE], isVerified)
  return {
    statement: denormalize(statement, statementSchema, state.entities),
    justificationsByPolarity,
    isFetching,
    errorMessage,
    hasAgreement,
    hasDisagreement,
    hasJustifications,
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