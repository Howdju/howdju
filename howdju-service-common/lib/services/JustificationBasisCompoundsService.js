const Promise = require('bluebird')
const every = require('lodash/every')
const forEach = require('lodash/forEach')
const map = require('lodash/map')

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

  // createJustificationBasisCompoundAtoms(justificationBasisCompound, atoms, userId, now) {
  //   return Promise.resolve()
  //       .then(() => Promise.all(map(atoms, atom =>
  //           getOrCreateValidJustificationBasisCompoundAtomEntity(this.statementsService,
  //               this.sourceExcerptParaphrasesService, atom, userId, now))))
  //       .then(atomsWithEntities => map(atomsWithEntities, ([atom, {entity}]) => {
  //         atom.entity = entity
  //         return atom
  //       }))
  //       .then(atoms => Promise.all([
  //         atoms,
  //         Promise.all(map(atoms, (atom, index) =>
  //             this.justificationBasisCompoundsDao.createJustificationBasisCompoundAtom(justificationBasisCompound, atom, index)))
  //       ]))
  //       .then(([atoms, dbAtoms]) => {
  //         // Merging ensures that both the statement text and atom IDs will be present
  //         const merged = map(zip(atoms, dbAtoms), ([atom, dbAtom]) => merge(atom, dbAtom))
  //         return merged
  //       })
  // }
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
        return justificationBasisCompoundsDao.readJustificationBasisCompoundHavingAtoms(atomWrappers)
          .then( (justificationBasisCompound) => {
            if (justificationBasisCompound) {
              justificationBasisCompound.atoms = map(atomWrappers, ({atom}) => atom)
              return {
                isExtant: true,
                justificationBasisCompound,
              }
            }

            return createJustificationBasisCompoundHavingAtoms(
              justificationBasisCompoundsDao,
              justificationBasisCompound,
              atomWrappers,
              userId,
              now
            )
              .then( (justificationBasisCompound) => ({
                isExtant: false,
                justificationBasisCompound
              }))
          })
      }

      return createJustificationBasisCompoundHavingAtoms(
        justificationBasisCompoundsDao,
        justificationBasisCompound,
        atomWrappers,
        userId,
        now
      )
        .then( (justificationBasisCompound) => ({
          isExtant: false,
          justificationBasisCompound
        }))
    })

  // Get or create atoms.  If all atoms are extant, then search for compound using them.  if not all are extant, then create one using them
  // return Promise.resolve()
  //     .then(equivalentJustificationBasisCompound => {
  //       const isExtant = !!equivalentJustificationBasisCompound
  //       return Promise.all([
  //         isExtant,
  //         isExtant ?
  //             equivalentJustificationBasisCompound :
  //             this.justificationBasisCompoundsDao.createJustificationBasisCompound(userId, justificationBasisCompound, now),
  //         justificationBasisCompound.atoms,
  //       ])
  //     })
  //     .then(([isExtant, justificationBasisCompound, atoms]) => Promise.all([
  //       isExtant,
  //       justificationBasisCompound,
  //       isExtant ?
  //           justificationBasisCompound.atoms :
  //           this.createJustificationBasisCompoundAtoms(justificationBasisCompound, atoms, userId, now)
  //     ]))
  //     .then(([isExtant, justificationBasisCompound, atoms]) => {
  //       justificationBasisCompound.atoms = atoms
  //       return {
  //         isExtant,
  //         justificationBasisCompound
  //       }
  //     })
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
  // set the atom entity after created

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
        .then( ({isExtant, statement: entity}) => ({isExtant, atom: {entity, type}}) )
    case JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE:
      return sourceExcerptsParaphrasesService.getOrCreateValidSourceExcerptParaphraseAsUser(atom.entity, userId, now)
        .then( ({isExtant, sourceExcerptParaphrase: entity}) => ({isExtant, atom: {entity, type}}) )
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

// function getOrCreateValidJustificationBasisCompoundAtomEntity(statementsService, sourceExcerptParaphrasesService, atom, userId, now) {
//   if (atom.entity.id) {
//     return [atom, {isExtant: true, entity: atom.entity}]
//   }
//
//   switch (atom.type) {
//     case JustificationBasisCompoundAtomType.STATEMENT:
//       return Promise.all([
//         atom,
//         statementsService.getOrCreateValidStatementAsUser(atom.entity, userId, now)
//             .then( ({isExtant, statement: entity}) => ({isExtant, entity}) )
//       ])
//     case JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE:
//       return Promise.all([
//         atom,
//         sourceExcerptParaphrasesService.getOrCreateValidSourceExcerptParaphraseAsUser(atom.entity, userId, now)
//             .then( ({isExtant, sourceExcerptParaphrase: entity}) => ({isExtant, entity}) )
//       ])
//     default:
//       throw newImpossibleError(`Unsupported JustificationBasisCompoundAtomEntityType: ${atom.type}`)
//   }
// }
