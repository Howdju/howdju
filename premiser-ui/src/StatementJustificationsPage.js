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
import FlipMove from 'react-flip-move';
import config from './config';


import {logError} from "./util";
import {isVerified, isDisverified, JustificationPolarity, isPositive, isNegative} from "./models";
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
    this.updateDimensions = this.updateDimensions.bind(this)
  }

  componentWillMount() {
    this.props.fetchStatementJustifications(this.props.match.params.statementId)
    this.updateDimensions();
  }

  componentDidMount() {
    window.addEventListener("resize", this.updateDimensions);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateDimensions);
  }

  onStatementMouseOver() {
    this.setState({isOverStatement: true})
  }

  onStatementMouseLeave() {
    this.setState({isOverStatement: false})
  }

  updateDimensions() {
    this.setState({width: window.innerWidth, height: window.innerHeight});
  }

  render () {
    const {
      statement,
      justifications,
      isFetching,
      errorMessage,
    } = this.props

    const {narrowBreakpoint, flipMoveDuration, flipMoveEasing} = config.ui.statementJustifications

    const isNarrow = this.state.width <= narrowBreakpoint
    const justificationsByPolarity =
        !isNarrow && groupBy(justifications, j => j.polarity) ||
        {
          [JustificationPolarity.POSITIVE]: [],
          [JustificationPolarity.NEGATIVE]: [],
        }

    const hasJustifications = justifications && justifications.length > 0
    const hasAgreement = some(justifications, j => isVerified(j) && isPositive(j))
    const hasDisagreement = some(justifications, j => isVerified(j) && isNegative(j))

    const statementCardClassNames = classNames({
      statementCard: true,
      agreement: hasAgreement,
      disagreement: hasDisagreement,
    })
    const menu = (
        <MenuButton
            icon
            id={`statement-${statement && statement.id}-context-menu`}
            menuClassName="statementContextMenu"
            buttonChildren={this.state.isOverStatement ? 'more_vert' : 'empty'}
            position={Positions.TOP_RIGHT}
        >
          <ListItem primaryText="Use" leftIcon={<FontIcon>call_made</FontIcon>} />
          <Divider />
          <ListItem primaryText="Edit" leftIcon={<FontIcon>create</FontIcon>} />
          <ListItem primaryText="Delete" leftIcon={<FontIcon>delete</FontIcon>} />
        </MenuButton>
    )
    const twoColumnJustifications = [
      <div key="positive-justifications" className="col-xs-6">

        <FlipMove duration={flipMoveDuration} easing={flipMoveEasing}>
          {justificationsByPolarity[JustificationPolarity.POSITIVE] && justificationsByPolarity[JustificationPolarity.POSITIVE].map(j => (
              <div className="row" key={j.id}>
                <div className="col-xs-12">
                  <Justification withCounterJustifications key={j.id} justification={j} positivey={true} />
                </div>
              </div>
          ))}
        </FlipMove>

      </div>,
      <div key="negative-justifications" className="col-xs-6">

        <FlipMove duration={flipMoveDuration} easing={flipMoveEasing}>
          {justificationsByPolarity[JustificationPolarity.NEGATIVE] && justificationsByPolarity[JustificationPolarity.NEGATIVE].map(j => (
              <div className="row" key={j.id}>
                <div className="col-xs-12">
                  <Justification withCounterJustifications key={j.id} justification={j} positivey={false} />
                </div>
              </div>
          ))}
        </FlipMove>

      </div>
    ]
    const singleColumnJustifications = (
      <div key="justifications" className="col-xs-12">

        <FlipMove duration={flipMoveDuration} easing={flipMoveEasing}>
          {justifications.map(j => (
              <div className="row" key={j.id}>
                <div className="col-xs-12">
                  <Justification withCounterJustifications justification={j} positivey={isPositive(j)} />
                </div>
              </div>
          ))}
        </FlipMove>

      </div>
    )
    const justificationRows = isNarrow ? singleColumnJustifications : twoColumnJustifications

    return (
        <DocumentTitle title={`${statement ? statement.text : 'Loading statement'} - Howdju`}>
          <div className="statement-justifications">

            <div className="row">
              <div className="col-xs-12">

                <div className="statement">

                  <Card className={statementCardClassNames}
                      onMouseOver={this.onStatementMouseOver}
                      onMouseLeave={this.onStatementMouseLeave}
                  >

                    <div className="md-grid">
                      <div className="md-cell md-cell--12 statementText">

                        {statement && menu}
                        {statement ?
                            statement.text :
                            isFetching ?
                                <CircularProgress id="fetchingStatementProgress" /> :
                                errorMessage
                        }

                      </div>
                    </div>

                  </Card>

                </div>

              </div>
            </div>
            <div className="row">
              {hasJustifications ?
                  justificationRows :
                  <div className="col-xs-12">
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
  return {
    statement: denormalize(statement, statementSchema, state.entities),
    justifications,
    isFetching,
    errorMessage,
  }
}

StatementJustificationsPage.defaultProps = {
  isFetching: false,
  errorMessage: '',
  statement: null,
  justifications: []
}

export default connect(mapStateToProps, {
  fetchStatementJustifications,
  acceptJustification,
  rejectJustification,
})(StatementJustificationsPage)