const Promise = require('bluebird')

const map = require('lodash/map')
const merge = require('lodash/merge')
const zip = require('lodash/zip')

const {
  ActionTargetType,
  ActionType,
} = require('howdju-common')

const {
  EntityValidationError
} = require('../serviceErrors')

exports.StatementCompoundsService = class StatementCompoundsService {

  constructor(statementCompoundValidator, actionsService, statementsService, statementCompoundsDao) {
    this.actionsService = actionsService
    this.statementCompoundValidator = statementCompoundValidator
    this.statementsService = statementsService
    this.statementCompoundsDao = statementCompoundsDao
  }

  readStatementCompound(authToken, statementCompoundId) {
    return this.statementCompoundsDao.read(statementCompoundId)
  }

  createStatementCompoundAsUser(statementCompound, userId, now) {
    return Promise.resolve()
      .then(() => {
        const validationErrors = this.statementCompoundValidator.validate(statementCompound)
        if (validationErrors.hasErrors) {
          throw new EntityValidationError(validationErrors)
        }
        return userId
      })
      .then(userId => this.createValidStatementCompoundAsUser(statementCompound, userId, now))
  }

  createValidStatementCompoundAsUser(statementCompound, userId, now) {
    return Promise.resolve()
      .then(() => statementCompound.id ?
        statementCompound :
        this.statementCompoundsDao.readStatementCompoundEquivalentTo(statementCompound)
      )
      .then(equivalentStatementCompound => {
        const isExtant = !!equivalentStatementCompound
        return Promise.all([
          isExtant,
          isExtant ? equivalentStatementCompound : this.statementCompoundsDao.createStatementCompound(userId, statementCompound, now),
          statementCompound.atoms,
        ])
      })
      .then(([isExtant, statementCompound, statementCompoundAtoms]) => Promise.all([
        isExtant,
        statementCompound,
        isExtant ? statementCompound.atoms : this.createStatementCompoundAtoms(statementCompound, statementCompoundAtoms, userId, now)
      ]))
      .then(([isExtant, statementCompound, statementCompoundAtoms]) => {
        const actionType = isExtant ? ActionType.TRY_CREATE_DUPLICATE : ActionType.CREATE
        this.actionsService.asyncRecordAction(userId, now, actionType, ActionTargetType.STATEMENT_COMPOUND, statementCompound.id)

        statementCompound.atoms = statementCompoundAtoms
        return {
          isExtant,
          statementCompound,
        }
      })
  }

  createStatementCompoundAtoms(statementCompound, statementCompoundAtoms, userId, now) {
    return Promise.resolve()
      .then(() => Promise.all(map(statementCompoundAtoms, atom =>
        atom.statement.id ?
          [atom, {isExtant: true, statement: atom.statement}] :
          Promise.all([atom, this.statementsService.getOrCreateStatementAsUser(atom.statement, userId, now)])
      )))
      .then(atomsWithStatements => map(atomsWithStatements, ([atom, {statement}]) => {
        atom.statement = statement
        return atom
      }))
      .then(atoms => Promise.all([
        atoms,
        Promise.all(map(atoms, (atom, index) => this.statementCompoundsDao.createStatementCompoundAtom(statementCompound, atom, index)))
      ]))
      .then(([atoms, dbAtoms]) => {
        // Merging ensures that both the statement text and atom IDs will be present
        const merged = map(zip(atoms, dbAtoms), ([atom, dbAtom]) => merge(atom, dbAtom))
        return merged
      })
  }
}
