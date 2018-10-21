const assign = require('lodash/assign')
const forEach = require('lodash/forEach')
const map = require('lodash/map')
const merge = require('lodash/merge')
const toString = require('lodash/toString')

const {
  newImpossibleError,
  newExhaustedEnumError,
} = require('./commonErrors')
const {
  JustificationPolarity,
  JustificationRootPolarity,
  JustificationVotePolarity,
  JustificationBasisType,
  JustificationTargetType,
  JustificationBasisCompoundAtomType,
  SourceExcerptType,
} = require('./enums')
const {
  isDefined
} = require('./general')


const _e = module.exports

_e.isPositive = (j) => j.polarity === JustificationPolarity.POSITIVE
_e.isNegative = (j) => j.polarity === JustificationPolarity.NEGATIVE
_e.isRootPositive = (j) => j.rootPolarity === JustificationRootPolarity.POSITIVE
_e.isRootNegative = (j) => j.rootPolarity === JustificationRootPolarity.NEGATIVE
_e.isVerified = (j) => j.vote && j.vote.polarity === JustificationVotePolarity.POSITIVE
_e.isDisverified = (j) => j.vote && j.vote.polarity === JustificationVotePolarity.NEGATIVE
_e.isCounter = (j) => j.target.type === JustificationTargetType.JUSTIFICATION && _e.isNegative(j)
_e.isRootJustification = (j) =>
  j.target.type === JustificationTargetType.STATEMENT &&
  j.target.entity.id === j.rootStatement.id
_e.hasQuote = (j) => _e.isWritQuoteBased(j) && j.basis.entity.quoteText
_e.isStatementCompoundBased = (j) => j ? j.basis.type === JustificationBasisType.STATEMENT_COMPOUND : false
_e.isWritQuoteBased = (j) => j ? j.basis.type === JustificationBasisType.WRIT_QUOTE : false
_e.isJustificationBasisCompoundBased = (j) => j ? j.basis.type === JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND : false

_e.negateJustificationVotePolarity = (polarity) => {
  switch (polarity) {
    case JustificationVotePolarity.POSITIVE:
      return JustificationVotePolarity.NEGATIVE
    case JustificationVotePolarity.NEGATIVE:
      return JustificationVotePolarity.POSITIVE
    default:
      throw newExhaustedEnumError('JustificationVotePolarity', polarity)
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

_e.makeNewCredentials = (props) => assign({email: '', password: ''}, props)

_e.makeNewStatement = (props) => assign({text: ''}, props)

_e.makeNewJustification = (props) => {
  let newJustification = {
    rootStatement: {id: null},
    polarity: JustificationPolarity.POSITIVE,
    rootPolarity: JustificationRootPolarity.POSITIVE,
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
  }

  if (
    props &&
    props.basis &&
    props.basis.type === JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND &&
    props.basis.justificationBasisCompound
  ) {
    translateNewJustificationBasisCompoundAtomEntities(props.basis.justificationBasisCompound.atoms)
  }

  newJustification = merge(newJustification, props)
  return newJustification
}

function translateNewJustificationBasisCompoundAtomEntities(atoms) {
  forEach(atoms, (atom) => {
    switch (atom.type) {
      case JustificationBasisCompoundAtomType.STATEMENT:
        atom.statement = atom.statement || atom.entity
        break
      case JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE:
        atom.sourceExcerptParaphrase = atom.sourceExcerptParaphrase || atom.entity
        translateNewSourceExcerptEntity(atom.sourceExcerptParaphrase.sourceExcerpt)
        break
      default:
        throw newExhaustedEnumError('JustificationBasisCompoundAtomType', atom.type)
    }
    delete atom.entity
  })
}

function translateNewSourceExcerptEntity(sourceExcerpt) {
  switch (sourceExcerpt.type) {
    case SourceExcerptType.WRIT_QUOTE:
      sourceExcerpt.writQuote = sourceExcerpt.writQuote || sourceExcerpt.entity
      break
    case SourceExcerptType.PIC_REGION:
      sourceExcerpt.picRegion = sourceExcerpt.picRegion || sourceExcerpt.entity
      break
    case SourceExcerptType.VID_SEGMENT:
      sourceExcerpt.vidSegment = sourceExcerpt.vidSegment || sourceExcerpt.entity
      break
    default:
      throw newExhaustedEnumError('SourceExcerptType', sourceExcerpt.type)
  }
  delete sourceExcerpt.entity
}

_e.makeNewWrit = (props) => merge({
  title: '',
}, props)

_e.makeNewSourceExcerptParaphrase = (props) => merge({
  paraphrasingStatement: _e.makeNewStatement(),
  sourceExcerpt: _e.makeNewSourceExcerpt(),
}, props)

_e.makeNewSourceExcerpt = () => ({
  type: SourceExcerptType.WRIT_QUOTE,
  writQuote: _e.makeNewWritQuote(),
})

_e.makeNewWritQuote = (props) => merge({
  writ: _e.makeNewWrit(),
  quoteText: '',
  urls: [_e.makeNewUrl()],
}, props)

_e.makeNewStatementCompound = (props) => assign(
  {atoms: [_e.makeNewStatementAtom()]},
  props
)

_e.makeNewJustificationBasisCompound = (props) => assign(
  {atoms: [_e.makeNewJustificationBasisCompoundAtom()]},
  props
)

_e.makeNewJustificationBasisCompoundAtom = (props) => {
  const atom = {
    type: JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE,
    statement: _e.makeNewStatement(),
    sourceExcerptParaphrase: _e.makeNewSourceExcerptParaphrase(),
  }

  if (
    props &&
    props.type === JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE &&
    props.sourceExcerptParaphrase.sourceExcerpt
  ) {
    translateNewSourceExcerptEntity(props.sourceExcerptParaphrase.sourceExcerpt)
  }

  return merge(atom, props)
}

_e.makeNewStatementAtom = (props) => assign(
  {entity: _e.makeNewStatement()},
  props
)

_e.makeNewJustificationBasisCompoundFromSourceExcerptParaphrase = (sourceExcerptParaphrase) =>
  _e.makeNewJustificationBasisCompound({
    atoms: [
      _e.makeNewJustificationBasisCompoundAtom({
        type: JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE,
        sourceExcerptParaphrase
      })
    ]
  })

_e.makeNewJustificationBasisCompoundFromStatement = (statement) =>
  _e.makeNewJustificationBasisCompound({
    atoms: [
      _e.makeNewJustificationBasisCompoundAtom({
        type: JustificationBasisCompoundAtomType.STATEMENT,
        statement
      })
    ]
  })

_e.makeNewJustificationBasisCompoundFromWritQuote = (writQuote) =>
  _e.makeNewJustificationBasisCompound({
    atoms: [
      _e.makeNewJustificationBasisCompoundAtom({
        sourceExcerptParaphrase: _e.makeNewSourceExcerptParaphrase({
          sourceExcerpt: {writQuote}
        })
      })
    ]
  })

_e.makeNewJustificationBasisCompoundFromStatementCompound = (statementCompound) =>
  _e.makeNewJustificationBasisCompound({
    atoms: map(statementCompound.atoms, statementAtom =>
      _e.makeNewJustificationBasisCompoundAtom({
        type: JustificationBasisCompoundAtomType.STATEMENT,
        statement: statementAtom.entity
      })
    )
  })

_e.makeNewStatementCompoundFromStatement = (statement) =>
  _e.makeNewStatementCompound({atoms: [_e.makeNewStatementAtom({entity: statement})]})

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
  // whether to have the justification controls expanded and to create a justification along with the statement
  doCreateJustification: !!justificationProps,
})

_e.makeNewCounterJustification = (targetJustification) => ({
  rootStatement: {id: targetJustification.rootStatement.id},
  target: {
    type: JustificationTargetType.JUSTIFICATION,
    entity: targetJustification,
  },
  basis: {
    type: JustificationBasisType.STATEMENT_COMPOUND,
    statementCompound: _e.makeNewStatementCompound()
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

_e.makeTag = (props) => merge({
  name: ''
}, props)

_e.tagEqual = (tag1, tag2) => _e.idEqual(tag1.id, tag2.id) || isDefined(tag1.name) && tag1.name === tag2.name

_e.makeStatementTagVote = (props) => merge({}, props)
