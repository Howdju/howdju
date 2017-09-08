const map = require('lodash/map')
const {
  JustificationBasisType,
  JustificationTargetType,
} = require('./enums')
const {
  newImpossibleError
} = require('./commonErrors')

exports.decircularizeStatementCompoundAtom = statementCompoundAtom => {
  statementCompoundAtom.statement = exports.decircularizeStatement(statementCompoundAtom.statement)
  return statementCompoundAtom
}
exports.decircularizeStatementCompound = statementCompound => {
  statementCompound.atoms = map(statementCompound.atoms, exports.decircularizeStatementCompoundAtom)
  return statementCompound
}
exports.decircularizeJustification = justification => {
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
      throw newImpossibleError(`Unsupported justification target type: ${justification.target.type}`)
  }

  switch (justification.basis.type) {
    case JustificationBasisType.STATEMENT_COMPOUND: {
      justification.basis.entity = exports.decircularizeStatementCompound(justification.basis.entity)
    }
      break
    case JustificationBasisType.CITATION_REFERENCE:
      // citation references don't have any references
      break
    default:
      throw newImpossibleError(`Unsupported justification basis type: ${justification.basis.type}`)
  }
  return justification
}
exports.decircularizeStatement = statement => {
  statement.justifications = map(statement.justifications, exports.decircularizeJustification)
  return statement
}
exports.decircularizePerspective = perspective => {
  perspective.statement = module.exports.decircularizeStatement(perspective.statement)
  return perspective
}
