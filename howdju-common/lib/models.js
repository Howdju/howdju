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
  JustificationRootTargetType,
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
// If a justification targets another justification, its polarity should always be negative
_e.isCounter = (j) => j.target.type === JustificationTargetType.JUSTIFICATION && _e.isNegative(j)
_e.isRootJustification = (j) =>
  j.target.type === j.rootTargetType &&
  j.target.entity.id === j.rootTarget.id
_e.hasQuote = (j) => _e.isWritQuoteBased(j) && j.basis.entity.quoteText
_e.isPropositionCompoundBased = (j) => j ? j.basis.type === JustificationBasisType.PROPOSITION_COMPOUND : false
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

_e.makeNewPasswordResetRequest = (props) => assign({
  email: '',
}, props)
_e.makeNewPasswordResetConfirmation = (props) => assign({
  userId: null,
  email: null,
  passwordResetCode: null,
}, props)

_e.makeNewRegistrationRequest = (props) => assign({
  email: '',
}, props)

_e.makeNewRegistrationConfirmation = (props) => assign({
  registrationCode: '',
  username: '',
  shortName: '',
  longName: '',
  password: '',
  doesAcceptTerms: false,
}, props)

_e.makeUser = (props) => assign({
  email: '',
  username: '',
  shortName: '',
  longName: '',
  acceptedTerms: null,
  affirmedMajorityConsent: null,
  affirmed13YearsOrOlder: null,
  affirmedNotGdpr: null,
  isActive: false,
}, props)

_e.makeAccountSettings = (props) => assign({
  paidContributionsDisclosure: '',
}, props)

_e.makeNewProposition = (props) => assign({text: ''}, props)

_e.makeNewStatement = (speaker, sentenceType, sentence) => ({
  speaker,
  sentenceType,
  sentence,
})

_e.makeNewJustification = (props) => {
  let newJustification = {
    rootTargetType: JustificationRootTargetType.PROPOSITION,
    rootTarget: {id: null},
    polarity: JustificationPolarity.POSITIVE,
    rootPolarity: JustificationRootPolarity.POSITIVE,
    target: {
      type: JustificationTargetType.PROPOSITION,
      entity: {
        id: null
      }
    },
    basis: {
      type: JustificationBasisType.PROPOSITION_COMPOUND,
      // Store both these types directly on the basis for the view-model
      // Before the justification is sent to the server, the one corresponding to the current type should be put on the
      // entity property
      writQuote: _e.makeNewWritQuote(),
      propositionCompound: _e.makeNewPropositionCompound(),
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

  correctJustificationRootPolarity(newJustification)

  return newJustification
}

_e.makeNewSourceExcerptJustification = props => {
  const init = {
    target: null,
    basis: {
      type: JustificationBasisType.WRIT_QUOTE,
      entity: null,
    },
  }
  const merged = merge(init, props)
  return merged
}

function correctJustificationRootPolarity(justification) {
  let targetEntity = justification.target.entity
  let rootPolarity = justification.polarity
  while (targetEntity.target) {
    rootPolarity = targetEntity.polarity
    targetEntity = targetEntity.target.entity
  }
  justification.rootTarget = targetEntity
  justification.rootPolarity = rootPolarity
}

function translateNewJustificationBasisCompoundAtomEntities(atoms) {
  forEach(atoms, (atom) => {
    switch (atom.type) {
      case JustificationBasisCompoundAtomType.PROPOSITION:
        atom.proposition = atom.proposition || atom.entity
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
  paraphrasingProposition: _e.makeNewProposition(),
  sourceExcerpt: _e.makeNewSourceExcerpt(),
}, props)

_e.makeNewSourceExcerpt = (props) => merge({
  type: SourceExcerptType.WRIT_QUOTE,
  writQuote: _e.makeNewWritQuote(),
}, props)

_e.makeNewWritQuote = (props) => merge({
  writ: _e.makeNewWrit(),
  quoteText: '',
  urls: [_e.makeNewUrl()],
}, props)

_e.makeNewPropositionCompound = (props) => assign(
  {atoms: [_e.makeNewPropositionAtom()]},
  props
)

_e.makeNewJustificationBasisCompound = (props) => assign(
  {atoms: [_e.makeNewJustificationBasisCompoundAtom()]},
  props
)

_e.makeNewJustificationBasisCompoundAtom = (props) => {
  const atom = {
    type: JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE,
    proposition: _e.makeNewProposition(),
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

_e.makeNewPropositionAtom = (props) => assign(
  {entity: _e.makeNewProposition()},
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

_e.makeNewJustificationBasisCompoundFromProposition = (proposition) =>
  _e.makeNewJustificationBasisCompound({
    atoms: [
      _e.makeNewJustificationBasisCompoundAtom({
        type: JustificationBasisCompoundAtomType.PROPOSITION,
        proposition
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

_e.makeNewJustificationBasisCompoundFromPropositionCompound = (propositionCompound) =>
  _e.makeNewJustificationBasisCompound({
    atoms: map(propositionCompound.atoms, propositionAtom =>
      _e.makeNewJustificationBasisCompoundAtom({
        type: JustificationBasisCompoundAtomType.PROPOSITION,
        proposition: propositionAtom.entity
      })
    )
  })

_e.makeNewPropositionCompoundFromProposition = (proposition) =>
  _e.makeNewPropositionCompound({atoms: [_e.makeNewPropositionAtom({entity: proposition})]})

/** Trunk justifications directly target the root */
_e.makeNewTrunkJustification = (targetType, targetId, polarity = null) => _e.makeNewJustification({
  rootTargetType: targetType,
  rootTarget: {id: targetId},
  polarity,
  target: { type: targetType, entity: { id: targetId } }
})

_e.makeNewPropositionJustification = (propositionProps, justificationProps) => ({
  proposition: _e.makeNewProposition(propositionProps),
  speakers: [],
  newJustification: _e.makeNewJustification(justificationProps),
  // whether to have the justification controls expanded and to create a justification along with the proposition
  doCreateJustification: !!justificationProps,
})

_e.makeNewCounterJustification = (targetJustification) => ({
  rootTargetType: targetJustification.rootTargetType,
  rootTarget: {id: targetJustification.rootTarget.id},
  target: {
    type: JustificationTargetType.JUSTIFICATION,
    entity: targetJustification,
  },
  basis: {
    type: JustificationBasisType.PROPOSITION_COMPOUND,
    propositionCompound: _e.makeNewPropositionCompound()
  },
  polarity: JustificationPolarity.NEGATIVE
})

_e.makeNewPropositionCompoundAtomFromProposition = (proposition) => ({
  entity: proposition,
})

_e.makeNewUrl = () => ({url: ''})

_e.makeNewPersorg = () => ({
  isOrganization: false,
  name: '',
  knownFor: '',
  websiteUrl: null,
  twitterUrl: null,
  wikipediaUrl: null,
})

_e.makeNewContentReport = (fields) => merge({
  entityType: null,
  entityId: null,
  // type (string) to boolean of whether the type is selected
  checkedByType: {},
  // Holds only the selected types; populated before posting to API
  types: [],
  description: "",
  url: null
}, fields)

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

_e.makePropositionTagVote = (props) => merge({}, props)

_e.doTargetSameRoot = (j1, j2) => _e.idEqual(j1.rootTarget.id, j2.rootTarget.id) && j1.rootTargetType === j2.rootTargetType

_e.makeNewAccountSettings = () => ({})
