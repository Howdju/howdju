import { connect } from 'react-redux'
import StatementJustifications from './StatementJustifications'
import { JustificationTargetType } from './models'


const mapStateToProps = (state) => {
  const statement = state.statementsById[state.statementPage.activeStatementId]
  const justifiesStatement = j =>
    j.target.type === JustificationTargetType.STATEMENT &&
    j.target.targetId === statement.id
  const justifications = state.justificationsById
      .filter(justifiesStatement)
      .sortBy(j => j.score)
      .toArray()
  return {
    statement: statement,
    justifications: justifications,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    onAcceptJustificationClick: justificationId => {
      dispatch(acceptJustification(justificationId))
    },
    onRejectJustificationClick: justificationId => {
      dispatch(rejectJustification(justificationId))
    }
  }
}

const StatementJustificationsContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(StatementJustifications)

export default StatementJustificationsContainer