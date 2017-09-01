const assign = require('lodash/assign')
const merge = require('lodash/merge')

const {newImpossibleError} = require('./commonErrors')
const {
  JustificationPolarity,
  JustificationRootPolarity,
  VotePolarity,
  JustificationBasisType,
  JustificationTargetType,
} = require('./enums')


const _e = module.exports

_e.isPositive = j => j.polarity === JustificationPolarity.POSITIVE
_e.isNegative = j => j.polarity === JustificationPolarity.NEGATIVE
_e.isRootPositive = j => j.rootPolarity === JustificationRootPolarity.POSITIVE
_e.isRootNegative = j => j.rootPolarity === JustificationRootPolarity.NEGATIVE
_e.isVerified = j => j.vote && j.vote.polarity === VotePolarity.POSITIVE
_e.isDisverified = j => j.vote && j.vote.polarity === VotePolarity.NEGATIVE
_e.isCounter = j => j.target.type === JustificationTargetType.JUSTIFICATION && _e.isNegative(j)
_e.isRootJustification = j =>
  j.target.type === JustificationTargetType.STATEMENT &&
  j.target.entity.id === j.rootStatement.id
_e.hasQuote = j => _e.isCitationReferenceBased(j) && j.basis.entity.quote
_e.isStatementCompoundBased = j => j ? j.basis.type === JustificationBasisType.STATEMENT_COMPOUND : false
_e.isCitationReferenceBased = j => j ? j.basis.type === JustificationBasisType.CITATION_REFERENCE : false

_e.negateVotePolarity = polarity => {
  switch (polarity) {
    case VotePolarity.POSITIVE:
      return VotePolarity.NEGATIVE
    case VotePolarity.NEGATIVE:
      return VotePolarity.POSITIVE
    default:
      throw newImpossibleError(`Unsupported vote polarity for negation: ${polarity}`)
  }
}

_e.negateRootPolarity = rootPolarity => {
  switch (rootPolarity) {
    case JustificationRootPolarity.POSITIVE:
      return JustificationRootPolarity.NEGATIVE
    case JustificationRootPolarity.NEGATIVE:
      return JustificationRootPolarity.POSITIVE
    default:
      throw newImpossibleError(`unsupported root polarity: ${rootPolarity}`)
  }
}

_e.makeNewCredentials = () => ({email: '', password: ''})

_e.makeNewStatement = props => assign({text: ''}, props)

_e.makeNewJustification = props => merge({
  rootStatement: {id: null},
  polarity: JustificationPolarity.POSITIVE,
  target: {
    type: JustificationTargetType.STATEMENT,
    entity: {
      id: null
    }
  },
  basis: {
    type: JustificationBasisType.STATEMENT_COMPOUND,
    // Store both these types directly on the basis for the view-model
    // Before the justification is sent to the server, the one corresponding to the current type should be put on the
    // entity property
    citationReference: _e.makeNewCitationReference(),
    statementCompound: _e.makeNewStatementCompound()
  }
}, props)

_e.makeNewCitation = () => ({
  text: '',
})

_e.makeNewCitationReference = () => ({
  citation: _e.makeNewCitation(),
  quote: '',
  urls: [_e.makeNewUrl()],
})

_e.makeNewStatementCompound = props => assign(
  {atoms: [_e.makeNewStatementAtom()]},
  props
)

_e.makeNewStatementAtom = props => assign(
  {statement: _e.makeNewStatement()},
  props
)

_e.makeNewStatementCompoundForStatement = statement =>
  _e.makeNewStatementCompound({atoms: [_e.makeNewStatementAtom({statement})]})

_e.makeNewJustificationTargetingStatementId = statementId => _e.makeNewJustification({
  rootStatement: {id: statementId},
  target: { type: JustificationTargetType.STATEMENT, entity: { id: statementId } }
})

_e.makeNewStatementJustification = (statementProps, justificationProps) => ({
  statement: _e.makeNewStatement(statementProps),
  justification: _e.makeNewJustification(justificationProps),
  doCreateJustification: !!justificationProps,
})

_e.makeNewCounterJustification = targetJustification => ({
  rootStatement: {id: targetJustification.rootStatement.id},
  target: {
    type: JustificationTargetType.JUSTIFICATION,
    entity: targetJustification,
  },
  basis: {
    type: JustificationBasisType.STATEMENT_COMPOUND,
    entity: _e.makeNewStatementCompound()
  },
  polarity: JustificationPolarity.NEGATIVE
})

_e.makeNewUrl = () => ({url: ''})
