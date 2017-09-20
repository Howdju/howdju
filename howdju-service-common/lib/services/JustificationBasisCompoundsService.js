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
    this.actionsService = actionsService
    this.justificationBasisCompoundValidator = justificationBasisCompoundValidator
    this.statementsService = statementsService
    this.sourceExcerptParaphrasesService = sourceExcerptParaphrasesService
    this.justificationBasisCompoundsDao = justificationBasisCompoundsDao
  }

  getOrCreateJustificationBasisCompoundAsUser(justificationBasisCompound, userId, now) {
    return Promise.resolve()
      .then(() => {
        const validationErrors = this.justificationBasisCompoundValidator.validate(justificationBasisCompound)
        if (validationErrors.hasErrors) {
          throw new EntityValidationError(validationErrors)
        }
        return userId
      })
      .then(userId => this.getOrCreateValidJustificationBasisCompoundAsUser(justificationBasisCompound, userId, now))
  }

  getOrCreateValidJustificationBasisCompoundAsUser(justificationBasisCompound, userId, now) {
    return getOrCreateJustificationBasisCompound(
      this.logger,
      this.statementsService,
      this.sourceExcerptParaphrasesService,
      this.justificationBasisCompoundsDao,
      justificationBasisCompound,
      userId,
      now
    )
      .then( ({isExtant, justificationBasisCompound}) => {
        const actionType = isExtant ? ActionType.TRY_CREATE_DUPLICATE : ActionType.CREATE
        this.actionsService.asyncRecordAction(userId, now, actionType, ActionTargetType.JUSTIFICATION_BASIS_COMPOUND, justificationBasisCompound.id)
        return {
          isExtant,
          justificationBasisCompound,
        }
      })
  }
}

function getOrCreateJustificationBasisCompound(
  logger,
  statementsService,
  sourceExcerptsParaphrasesService,
  justificationBasisCompoundsDao,
  justificationBasisCompound,
  userId,
  now
) {
  if (justificationBasisCompound.id) {
    return justificationBasisCompoundsDao.readJustificationBasisCompoundForId(justificationBasisCompound.id)
      .then( (justificationBasisCompound) => {
        if (justificationBasisCompound) {

          return addAtomsToCompound(
            logger,
            statementsService,
            sourceExcerptsParaphrasesService,
            justificationBasisCompoundsDao,
            justificationBasisCompound,
            userId,
            now
          )
            .then( (justificationBasisCompound) => ({
              isExtant: true,
              justificationBasisCompound
            }))
        }

        logger.warning(`JustificationBasisCompound having ID ${justificationBasisCompound.id} missing.  Getting or creating equivalent`)
        return getOrCreateEquivalentJustificationBasisCompound(
          logger,
          statementsService,
          sourceExcerptsParaphrasesService,
          justificationBasisCompoundsDao,
          justificationBasisCompound,
          userId,
          now
        )
      })
  }

  return getOrCreateEquivalentJustificationBasisCompound(
    logger,
    statementsService,
    sourceExcerptsParaphrasesService,
    justificationBasisCompoundsDao,
    justificationBasisCompound,
    userId,
    now
  )
}

function getOrCreateEquivalentJustificationBasisCompound(
  logger,
  statementsService,
  sourceExcerptsParaphrasesService,
  justificationBasisCompoundsDao,
  justificationBasisCompound,
  userId,
  now
) {
  return Promise.all(map(justificationBasisCompound.atoms, atom => getOrCreateJustificationBasisCompoundAtomEntity(
    logger,
    statementsService,
    sourceExcerptsParaphrasesService,
    atom,
    userId,
    now
  )))
    .then( (atomWrappers) => {
      if (every(atomWrappers, ({isExtant}) => isExtant)) {
        const atoms = map(atomWrappers, ({atom}) => atom)
        return justificationBasisCompoundsDao.readJustificationBasisCompoundHavingAtoms(atoms)
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
              justificationBasisCompoundsDao,
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
        justificationBasisCompoundsDao,
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

function addAtomsToCompound(
  logger,
  statementsService,
  sourceExcerptsParaphrasesService,
  justificationBasisCompoundsDao,
  justificationBasisCompound,
  userId,
  now
) {
  return justificationBasisCompoundsDao.readAtomsForJustificationBasisCompoundId(justificationBasisCompound.id)
    .then( (atoms) => Promise.all(map(atoms, atom =>
      getJustificationBasisCompoundAtomEntity(
        logger,
        statementsService,
        sourceExcerptsParaphrasesService,
        atom,
        userId,
        now
      )
    )))
    .then( (entities) => {
      forEach(entities, (entity, index) => {
        if (!entity) {
          const atom = justificationBasisCompound.atoms[index]
          const atomEntityType = atom.type
          const atomEntityId = atom.id
          logger.error(`justificationBasisCompound ID ${justificationBasisCompound.id} atom number ${index} (type ${atomEntityType}, ID ${atomEntityId}) was not found`)
        }
        justificationBasisCompound.atoms[index].entity = entity
      })

      return justificationBasisCompound
    })
}

function createJustificationBasisCompoundHavingAtoms(
  justificationBasisCompoundsDao,
  justificationBasisCompound,
  atoms,
  userId,
  now
) {
  return justificationBasisCompoundsDao.createJustificationBasisCompound(
    justificationBasisCompound,
    userId,
    now
  )
    .then( (justificationBasisCompound) => {
      return Promise.all([
        justificationBasisCompound,
        Promise.all(map(atoms, (atom, index) => createJustificationBasisCompoundAtom(
          justificationBasisCompoundsDao,
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
  justificationBasisCompoundsDao,
  justificationBasisCompound,
  atom,
  orderPosition
) {
  return justificationBasisCompoundsDao.createAtomForJustificationBasisCompoundId(
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

function getOrCreateJustificationBasisCompoundAtomEntity(
  logger,
  statementsService,
  sourceExcerptsParaphrasesService,
  atom,
  userId,
  now
) {
  const type = atom.type
  switch (type) {
    case JustificationBasisCompoundAtomType.STATEMENT:
      return statementsService.getOrCreateValidStatementAsUser(atom.entity, userId, now)
        .then( ({isExtant, statement}) => {
          atom.entity = statement
          return {
            isExtant,
            atom,
          }
        })
    case JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE:
      return sourceExcerptsParaphrasesService.getOrCreateValidSourceExcerptParaphraseAsUser(atom.entity, userId, now)
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
  logger,
  statementsService,
  sourceExcerptsParaphrasesService,
  atom,
  userId,
  now
) {
  const atomType = atom.type
  switch (atomType) {
    case JustificationBasisCompoundAtomType.STATEMENT:
      return statementsService.readStatement(atom.entity, userId, now)
    case JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE:
      return sourceExcerptsParaphrasesService.readSourceExcerptParaphrase(atom.entity, userId, now)
    default:
      throw newExhaustedEnumError('JustificationBasisCompoundAtomType', atom.type)
  }
}
