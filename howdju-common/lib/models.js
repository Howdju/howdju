const assign = require('lodash/assign')
const merge = require('lodash/merge')
const toString = require('lodash/toString')

const {newImpossibleError} = require('./commonErrors')
const {
  JustificationPolarity,
  JustificationRootPolarity,
  VotePolarity,
  JustificationBasisType,
  JustificationTargetType,
  JustificationBasisCompoundAtomType,
} = require('./enums')
const {
  isDefined
} = require('./general')


const _e = module.exports

_e.isPositive = (j) => j.polarity === JustificationPolarity.POSITIVE
_e.isNegative = (j) => j.polarity === JustificationPolarity.NEGATIVE
_e.isRootPositive = (j) => j.rootPolarity === JustificationRootPolarity.POSITIVE
_e.isRootNegative = (j) => j.rootPolarity === JustificationRootPolarity.NEGATIVE
_e.isVerified = (j) => j.vote && j.vote.polarity === VotePolarity.POSITIVE
_e.isDisverified = (j) => j.vote && j.vote.polarity === VotePolarity.NEGATIVE
_e.isCounter = (j) => j.target.type === JustificationTargetType.JUSTIFICATION && _e.isNegative(j)
_e.isRootJustification = (j) =>
  j.target.type === JustificationTargetType.STATEMENT &&
  j.target.entity.id === j.rootStatement.id
_e.hasQuote = (j) => _e.isWritQuoteBased(j) && j.basis.entity.quoteText
_e.isStatementCompoundBased = (j) => j ? j.basis.type === JustificationBasisType.STATEMENT_COMPOUND : false
_e.isWritQuoteBased = (j) => j ? j.basis.type === JustificationBasisType.WRIT_QUOTE : false
_e.isJustificationBasisCompoundBased = (j) => j ? j.basis.type === JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND : false

_e.negateVotePolarity = (polarity) => {
  switch (polarity) {
    case VotePolarity.POSITIVE:
      return VotePolarity.NEGATIVE
    case VotePolarity.NEGATIVE:
      return VotePolarity.POSITIVE
    default:
      throw newImpossibleError(`Unsupported vote polarity for negation: ${polarity}`)
  }
}

_e.negateRootPolarity = (rootPolarity) => {
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

_e.makeNewStatement = (props) => assign({text: ''}, props)

_e.makeNewJustification = (props) => merge({
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
    writQuote: _e.makeNewWritQuote(),
    statementCompound: _e.makeNewStatementCompound(),
    justificationBasisCompound: _e.makeNewJustificationBasisCompound(),
  }
}, props)

_e.makeNewWrit = () => ({
  title: '',
})

_e.makeNewJustificationBasisCompound = () => ({
  atoms: [_e.makeNewJustificationBasisAtom()]
})

_e.makeNewJustificationBasisAtom = () => ({
  type: JustificationBasisCompoundAtomType.STATEMENT,
  entity: _e.makeNewStatement()
})

_e.makeNewWritQuote = () => ({
  writ: _e.makeNewWrit(),
  quoteText: '',
  urls: [_e.makeNewUrl()],
})

_e.makeNewStatementCompound = (props) => assign(
  {atoms: [_e.makeNewStatementAtom()]},
  props
)

_e.makeNewStatementAtom = (props) => assign(
  {entity: _e.makeNewStatement()},
  props
)

_e.makeNewStatementCompoundForStatement = (statement) =>
  _e.makeNewStatementCompound({atoms: [_e.makeNewStatementAtom({statement})]})

_e.makeNewJustificationTargetingStatementId = (statementId) => _e.makeNewJustification({
  rootStatement: {id: statementId},
  target: { type: JustificationTargetType.STATEMENT, entity: { id: statementId } }
})

_e.makeNewJustificationTargetingStatementIdWithPolarity = (statementId, polarity) => _e.makeNewJustification({
  rootStatement: {id: statementId},
  polarity,
  target: { type: JustificationTargetType.STATEMENT, entity: { id: statementId } }
})

_e.makeNewStatementJustification = (statementProps, justificationProps) => ({
  statement: _e.makeNewStatement(statementProps),
  newJustification: _e.makeNewJustification(justificationProps),
  doCreateJustification: !!justificationProps,
})

_e.makeNewCounterJustification = (targetJustification) => ({
  rootStatement: {id: targetJustification.rootStatement.id},
  target: {
    type: JustificationTargetType.JUSTIFICATION,
    entity: targetJustification,
  },
  basis: {
    type: JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND,
    entity: _e.makeNewJustificationBasisCompound()
  },
  polarity: JustificationPolarity.NEGATIVE
})

_e.makeNewUrl = () => ({url: ''})

/**
 * Compare two entity IDs for equality
 *
 * If the ID came from the database, it may be an integer.  So convert both to string before doing strict equality.
 * The orm mappers and dao methods (in the case of a dao method returning a bare ID) are responsible for converting IDs
 * to strings.  But because this comparison is so important, it is worthwile having a special method to ensure that
 * there is no mistake.  One thing we don't do is convert an integer identifier from the client into a string, e.g..
 */
_e.idEqual = (id1, id2) => isDefined(id1) && isDefined(id2) && toString(id1) === toString(id2)