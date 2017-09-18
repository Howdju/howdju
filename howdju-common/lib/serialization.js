const forEach = require('lodash/forEach')
const map = require('lodash/map')

const {
  JustificationBasisType,
  JustificationTargetType,
  JustificationBasisCompoundAtomType,
} = require('./enums')
const {
  newExhaustedEnumError,
} = require('./commonErrors')

exports.decircularizeStatementCompoundAtom = (statementCompoundAtom) => {
  statementCompoundAtom.entity = exports.decircularizeStatement(statementCompoundAtom.entity)
  return statementCompoundAtom
}

exports.decircularizeStatementCompound = (statementCompound) => {
  statementCompound.atoms = map(statementCompound.atoms, exports.decircularizeStatementCompoundAtom)
  return statementCompound
}

exports.decircularizeJustification = (justification) => {
  if (justification.rootStatement.id) {
    justification.rootStatement = {id: justification.rootStatement.id}
  }
  justification.counterJustifications = map(justification.counterJustifications, exports.decircularizeJustification)

  switch (justification.target.type) {
    case JustificationTargetType.STATEMENT:
      if (justification.target.entity.id) {
        justification.target.entity = {id: justification.target.entity.id}
      }
      break
    case JustificationTargetType.JUSTIFICATION:
      if (justification.target.entity.id) {
        justification.target.entity = {id: justification.target.entity.id}
      }
      break
    default:
      throw newExhaustedEnumError('JustificationTargetType', justification.target.type)
  }

  switch (justification.basis.type) {
    case JustificationBasisType.STATEMENT_COMPOUND: {
      justification.basis.entity = exports.decircularizeStatementCompound(justification.basis.entity)
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
    case JustificationBasisCompoundAtomType.STATEMENT:
      atom.entity = exports.decircularizeStatement(atom.entity)
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
  sourceExcerptParaphrase.paraphrasingStatement = exports.decircularizeStatement(sourceExcerptParaphrase.paraphrasingStatement)
  sourceExcerptParaphrase.sourceExcerpt = exports.decircularizeSourceExcerpt(sourceExcerptParaphrase.sourceExcerpt)
  return sourceExcerptParaphrase
}

exports.decircularizeSourceExcerpt = (sourceExcerpt) => {
  // Source excerpts don't reference any entities that need decircularizing
  return sourceExcerpt
}

exports.decircularizeStatement = (statement) => {
  if (statement.justifications) {
    statement.justifications = map(statement.justifications, exports.decircularizeJustification)
  }
  return statement
}

exports.decircularizePerspective = (perspective) => {
  perspective.statement = module.exports.decircularizeStatement(perspective.statement)
  return perspective
}
