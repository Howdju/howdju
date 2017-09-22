const Promise = require('bluebird')
const every = require('lodash/every')
const forEach = require('lodash/forEach')
const map = require('lodash/map')
const zip = require('lodash/zip')

const {
  ActionTargetType,
  ActionType,
  JustificationBasisCompoundAtomType,
  newExhaustedEnumError,
  requireArgs,
} = require('howdju-common')

const {
  EntityValidationError
} = require('../serviceErrors')


exports.JustificationBasisCompoundsService = class JustificationBasisCompoundsService {

  constructor(
    logger,
    justificationBasisCompoundValidator,
    actionsService,
    statementsService,
    sourceExcerptParaphrasesService,
    justificationBasisCompoundsDao
  ) {
    requireArgs({
      logger,
      justificationBasisCompoundValidator,
      actionsService,
      statementsService,
      sourceExcerptParaphrasesService,
      justificationBasisCompoundsDao
    })

    this.logger = logger
    this.justificationBasisCompoundValidator = justificationBasisCompoundValidator
    this.actionsService = actionsService
    this.statementsService = statementsService
    this.sourceExcerptParaphrasesService = sourceExcerptParaphrasesService
    this.justificationBasisCompoundsDao = justificationBasisCompoundsDao
  }

  readJustificationBasisCompoundForId(justificationBasisCompoundId, {authToken, userId}) {
    return readJustificationBasisCompoundForId(
      this,
      justificationBasisCompoundId,
      userId
    )
  }

  readOrCreateJustificationBasisCompoundAsUser(justificationBasisCompound, userId, now) {

    return Promise.resolve()
      .then(() => {
        const validationErrors = this.justificationBasisCompoundValidator.validate(justificationBasisCompound)
        if (validationErrors.hasErrors) {
          throw new EntityValidationError(validationErrors)
        }
        return userId
      })
      .then(userId => this.readOrCreateValidJustificationBasisCompoundAsUser(justificationBasisCompound, userId, now))
  }

  readOrCreateValidJustificationBasisCompoundAsUser(justificationBasisCompound, userId, now) {
    return Promise.resolve()
      .then(() => {
        if (justificationBasisCompound.id) {
          return Promise.props({
            isExtant: true,
            justificationBasisCompound: this.readJustificationBasisCompoundForId(justificationBasisCompound.id)
          })
        }

        return readOrCreateEquivalentValidJustificationBasisCompoundAsUser(this, justificationBasisCompound, userId, now)
      })
  }
}

function readJustificationBasisCompoundForId(
  service,
  justificationBasisCompoundId,
  userId
) {
  return service.justificationBasisCompoundsDao.readJustificationBasisCompoundForId(justificationBasisCompoundId)
    .then( (justificationBasisCompound) => Promise.all([
      justificationBasisCompound,
      justificationBasisCompound && readAtomsForCompound(
        service,
        justificationBasisCompound,
        userId
      )
    ]))
    .then( ([justificationBasisCompound, atoms]) => {
      if (atoms) {
        justificationBasisCompound.atoms = atoms
      }
      return justificationBasisCompound
    })
}

function readOrCreateEquivalentValidJustificationBasisCompoundAsUser(
  service,
  justificationBasisCompound,
  userId,
  now
) {
  return Promise.all(map(justificationBasisCompound.atoms, atom => readOrCreateJustificationBasisCompoundAtomEntity(
    service,
    atom,
    userId,
    now
  )))
    .then( (atomWrappers) => {
      if (every(atomWrappers, ({isExtant}) => isExtant)) {
        const atoms = map(atomWrappers, ({atom}) => atom)
        return service.justificationBasisCompoundsDao.readJustificationBasisCompoundHavingAtoms(atoms)
          .then( (justificationBasisCompound) => {
            if (justificationBasisCompound) {
              // The atoms on the justificationBasisCompound will have their atom ID, and the ones previously read will have the entities with IDs
              forEach(zip(justificationBasisCompound.atoms, atoms), ([compoundAtom, atom]) => {
                compoundAtom.entity = atom.entity
              })
              return {
                isExtant: true,
                justificationBasisCompound,
              }
            }

            return createJustificationBasisCompoundHavingAtoms(
              service,
              justificationBasisCompound,
              atoms,
              userId,
              now
            )
              .then( (justificationBasisCompound) => ({
                isExtant: false,
                justificationBasisCompound
              }))
          })
      }

      const atoms = map(atomWrappers, ({atom}) => atom)
      return createJustificationBasisCompoundHavingAtoms(
        service,
        justificationBasisCompound,
        atoms,
        userId,
        now
      )
        .then( (justificationBasisCompound) => ({
          isExtant: false,
          justificationBasisCompound
        }))
    })
    .then( ({isExtant, justificationBasisCompound}) => {
      const actionType = isExtant ? ActionType.TRY_CREATE_DUPLICATE : ActionType.CREATE
      service.actionsService.asyncRecordAction(userId, now, actionType, ActionTargetType.JUSTIFICATION_BASIS_COMPOUND, justificationBasisCompound.id)
      return {
        isExtant,
        justificationBasisCompound,
      }
    })
}

function readAtomsForCompound(
  service,
  justificationBasisCompound,
  userId
) {
  return service.justificationBasisCompoundsDao.readAtomsForJustificationBasisCompoundId(justificationBasisCompound.id)
    .then( (atoms) => Promise.all([
      atoms,
      Promise.all(map(atoms, atom =>
        getJustificationBasisCompoundAtomEntity(
          service,
          atom.type,
          atom.entity.id,
          userId
        )
      ))
    ]))
    .then( ([atoms, entities]) => {
      forEach(zip(atoms, entities), ([atom, entity], index) => {
        if (!entity) {
          service.logger.error(`justificationBasisCompound ID ${justificationBasisCompound.id} atom number ${index} (type ${atom.type}, ID ${atom.entity.id}) entity was not found`)
        }
        atom.entity = entity
      })

      return atoms
    })
}

function createJustificationBasisCompoundHavingAtoms(
  service,
  justificationBasisCompound,
  atoms,
  userId,
  now
) {
  return service.justificationBasisCompoundsDao.createJustificationBasisCompound(
    justificationBasisCompound,
    userId,
    now
  )
    .then( (justificationBasisCompound) => {
      return Promise.all([
        justificationBasisCompound,
        Promise.all(map(atoms, (atom, index) => createJustificationBasisCompoundAtom(
          service,
          justificationBasisCompound,
          atom,
          index
        )))
      ])
    })
    .then( ([justificationBasisCompound, atoms]) => {
      justificationBasisCompound.atoms = atoms
      return justificationBasisCompound
    })
}

function createJustificationBasisCompoundAtom(
  service,
  justificationBasisCompound,
  atom,
  orderPosition
) {
  return service.justificationBasisCompoundsDao.createAtomForJustificationBasisCompoundId(
    justificationBasisCompound.id,
    atom.type,
    atom.entity.id,
    orderPosition
  )
    .then( (dbAtom) => {
      dbAtom.entity = atom.entity
      return dbAtom
    })
}

function readOrCreateJustificationBasisCompoundAtomEntity(
  service,
  atom,
  userId,
  now
) {
  const type = atom.type
  switch (type) {
    case JustificationBasisCompoundAtomType.STATEMENT:
      return service.statementsService.readOrCreateValidStatementAsUser(atom.entity, userId, now)
        .then( ({isExtant, statement}) => {
          atom.entity = statement
          return {
            isExtant,
            atom,
          }
        })
    case JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE:
      return service.sourceExcerptParaphrasesService.readOrCreateValidSourceExcerptParaphraseAsUser(atom.entity, userId, now)
        .then( ({isExtant, sourceExcerptParaphrase}) => {
          atom.entity = sourceExcerptParaphrase
          return {
            isExtant,
            atom,
          }
        })
    default:
      throw newExhaustedEnumError('JustificationBasisCompoundAtomType', atom.type)
  }
}

function getJustificationBasisCompoundAtomEntity(
  service,
  entityType,
  entityId,
  userId
) {
  switch (entityType) {
    case JustificationBasisCompoundAtomType.STATEMENT:
      return service.statementsService.readStatementForId(entityId, {userId})
    case JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE:
      return service.sourceExcerptParaphrasesService.readSourceExcerptParaphraseForId(entityId, {userId})
    default:
      throw newExhaustedEnumError('JustificationBasisCompoundAtomType', entityType)
  }
}
