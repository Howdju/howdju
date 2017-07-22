const map = require('lodash/map')
const {
  JustificationBasisType,
  JustificationTargetType,
} = require('./models')
const {
  ImpossibleError
} = require('./errors')

module.exports.decircularizeStatementCompoundAtom = statementCompoundAtom => {
  statementCompoundAtom.statement = module.exports.decircularizeStatement(statementCompoundAtom.statement)
  return statementCompoundAtom
}
module.exports.decircularizeStatementCompound = statementCompound => {
  statementCompound.atoms = map(statementCompound.atoms, module.exports.decircularizeStatementCompoundAtom)
  return statementCompound
}
module.exports.decircularizeJustification = justification => {
  justification.rootStatement = {id: justification.rootStatement.id}

  switch (justification.target.type) {
    case JustificationTargetType.STATEMENT: {
        justification.target.entity = {id: justification.target.entity.id}
      }
      break
    case JustificationTargetType.JUSTIFICATION:
      // target justifications are ok
      break
    default:
      throw new ImpossibleError(`Unsupported justification target type: ${justification.target.type}`)
  }

  switch (justification.basis.type) {
    case JustificationBasisType.STATEMENT_COMPOUND: {
      justification.basis.entity = module.exports.decircularizeStatementCompound(justification.basis.entity)
    }
      break
    case JustificationBasisType.CITATION_REFERENCE:
      // citation references don't have any references
      break
    default:
      throw new ImpossibleError(`Unsupported justification basis type: ${justification.basis.type}`)
  }
  return justification
}
module.exports.decircularizeStatement = statement => {
  statement.justifications = map(statement.justifications, module.exports.decircularizeJustification)
  return statement
}
module.exports.decircularizePerspective = perspective => {
  perspective.statement = module.exports.decircularizeStatement(perspective.statement)
  return perspective
}