const forEach = require('lodash/forEach')
const map = require('lodash/map')

const {
  JustificationBasisType,
  JustificationBasisCompoundAtomType,
} = require('./enums')
const {
  newExhaustedEnumError,
} = require('./commonErrors')

exports.decircularizePropositionCompoundAtom = (propositionCompoundAtom) => {
  propositionCompoundAtom.entity = exports.decircularizeProposition(propositionCompoundAtom.entity)
  return propositionCompoundAtom
}

exports.decircularizePropositionCompound = (propositionCompound) => {
  propositionCompound.atoms = map(propositionCompound.atoms, exports.decircularizePropositionCompoundAtom)
  return propositionCompound
}

exports.decircularizeJustification = (justification) => {
  if (justification.rootTarget.id) {
    justification.rootTarget = {id: justification.rootTarget.id}
  }
  if (justification.counterJustifications) {
    justification.counterJustifications = map(justification.counterJustifications, exports.decircularizeJustification)
  }

  if (justification.target.entity.id) {
    justification.target.entity = {id: justification.target.entity.id}
  }

  switch (justification.basis.type) {
    case JustificationBasisType.PROPOSITION_COMPOUND: {
      justification.basis.entity = exports.decircularizePropositionCompound(justification.basis.entity)
    }
      break
    case JustificationBasisType.WRIT_QUOTE:
      // writ quotes can't have circular dependencies.  They reference writs, which are leaf entities.
      break
    case JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND:
      forEach(justification.basis.entity.atoms, exports.decircularizeJustificationBasisCompoundAtom)
      break
    default:
      throw newExhaustedEnumError('JustificationBasisType', justification.basis.type)
  }
  return justification
}

exports.decircularizeJustificationBasisCompoundAtom = (atom) => {
  switch (atom.type) {
    case JustificationBasisCompoundAtomType.PROPOSITION:
      atom.entity = exports.decircularizeProposition(atom.entity)
      break
    case JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE:
      atom.entity = exports.decircularizeSourceExcerptParaphrase(atom.entity)
      break
    default:
      throw newExhaustedEnumError('JustificationBasisCompoundAtomType', atom.entityType)
  }
  return atom
}

exports.decircularizeSourceExcerptParaphrase = (sourceExcerptParaphrase) => {
  sourceExcerptParaphrase.paraphrasingProposition = exports.decircularizeProposition(sourceExcerptParaphrase.paraphrasingProposition)
  sourceExcerptParaphrase.sourceExcerpt = exports.decircularizeSourceExcerpt(sourceExcerptParaphrase.sourceExcerpt)
  return sourceExcerptParaphrase
}

exports.decircularizeSourceExcerpt = (sourceExcerpt) => {
  // Source excerpts don't reference any entities that need decircularizing
  return sourceExcerpt
}

exports.decircularizeProposition = (proposition) => {
  if (proposition.justifications) {
    proposition.justifications = map(proposition.justifications, exports.decircularizeJustification)
  }
  return proposition
}

exports.decircularizePerspective = (perspective) => {
  perspective.proposition = module.exports.decircularizeProposition(perspective.proposition)
  return perspective
}
