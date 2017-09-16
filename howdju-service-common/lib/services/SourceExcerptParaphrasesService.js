const Promise = require('bluebird')

const {
  ActionType,
  ActionTargetType,
  requireArgs,
  SourceExcerptType,
  newImpossibleError,
} = require('howdju-common')

exports.SourceExcerptParaphrasesService = class SourceExcerptParaphrasesService {
  constructor(
    logger,
    sourceExcerptParaphrasesDao,
    statementsService,
    writQuotesService,
    picRegionsService,
    vidSegmentsService
  ) {
    requireArgs({
      logger,
      sourceExcerptParaphrasesDao,
      statementsService,
      writQuotesService,
      picRegionsService,
      vidSegmentsService
    })

    this.logger = logger
    this.sourceExcerptParaphrasesDao = sourceExcerptParaphrasesDao
    this.statementsService = statementsService
    this.writQuotesService = writQuotesService
    this.picRegionsService = picRegionsService
    this.vidSegmentsService = vidSegmentsService
  }

  readSourceExcerptParaphrase(sourceExcerptParaphrase) {
    return getSourceExcerptParaphrase(
      this.logger,
      this.statementsService,
      this.writQuotesService,
      this.picRegionsService,
      this.vidSegmentsService,
      this.sourceExcerptParaphrasesDao,
      sourceExcerptParaphrase
    )
  }

  getOrCreateValidSourceExcerptParaphraseAsUser(sourceExcerptParaphrase, userId, now) {
    return getOrCreateSourceExcerptParaphrase(
      this.logger,
      this.statementsService,
      this.writQuotesService,
      this.picRegionsService,
      this.vidSegmentsService,
      this.sourceExcerptParaphrasesDao,
      sourceExcerptParaphrase,
      userId,
      now
    )
      .then( ({isExtant, sourceExcerptParaphrase}) => {
        const actionType = isExtant ? ActionType.TRY_CREATE_DUPLICATE : ActionType.CREATE
        this.actionsService.asyncRecordAction(userId, now, actionType, ActionTargetType.SOURCE_EXCERPT_PARAPHRASE,
          sourceExcerptParaphrase.id)

        return {
          isExtant,
          sourceExcerptParaphrase,
        }
      })
  }
}

// function readSourceExcerptParaphraseOrEquivalent(statementsService, sourceExcerptParaphrasesDao, sourceExcerptParaphrase) {
//   if (sourceExcerptParaphrase.id) {
//     return sourceExcerptParaphrasesDao.readSourceExcerptParaphraseForId(sourceExcerptParaphrase.id)
//         .then( (sourceExcerptParaphrase) => {
//           if (sourceExcerptParaphrase) {
//             return sourceExcerptParaphrase
//           }
//
//           return readEquivalentSourceExcerptParaphrase(
//               statementsService,
//               writQuotesService,
//               picRegionsService,
//               vidSegmentsService,
//               sourceExcerptParaphrasesDao,
//               sourceExcerptParaphrase
//           )
//         })
//   }
//
//   return readEquivalentSourceExcerptParaphrase(statementsService,
//       writQuotesService,
//       picRegionsService,
//       vidSegmentsService,
//       sourceExcerptParaphrasesDao,
//       sourceExcerptParaphrase
//   )
// }

// function readEquivalentSourceExcerptParaphrase (
//   statementsService,
//   writQuotesService,
//   picRegionsService,
//   vidSegmentsService,
//   sourceExcerptParaphrasesDao,
//   sourceExcerptParaphrase
// ) {
//   return Promise.all([
//     statementsService.readStatementEquivalentTo(sourceExcerptParaphrase.paraphrasingStatement),
//     readEquivalentSourceExcerpt(sourceExcerptParaphrase.sourceExcerpt, writQuotesService, picRegionsService, vidSegmentsService)
//   ])
//       .then( ([equivalentStatement, equivalentSourceExcerpt]) => {
//         if (equivalentStatement && equivalentSourceExcerpt) {
//           return sourceExcerptParaphrasesDao.readSourceExcerptHavingStatementAndSourceExcerpt(equivalentStatement, equivalentSourceExcerpt)
//         }
//
//         return null
//       })
// }

// function readEquivalentSourceExcerpt(sourceExcerpt, writQuotesService, picRegionsService, vidSegmentsService) {
//   switch (sourceExcerpt.type) {
//     case SourceExcerptType.WRIT_QUOTE:
//       return writQuotesService.readWritQuoteEquivalentTo(sourceExcerpt.entity)
//     case SourceExcerptType.PIC_REGION:
//       return picRegionsService.readPicRegionEquivalentTo(sourceExcerpt.entity)
//     case SourceExcerptType.VID_SEGMENT:
//       return vidSegmentsService.readVidSegmentEquivalentTo(sourceExcerpt.entity)
//     default:
//       throw newImpossibleError(`Impossible SourceExcerptType: ${sourceExcerpt.type}`)
//   }
// }

function getSourceExcerptParaphrase(
  logger,
  statementsService,
  writQuotesService,
  picRegionsService,
  vidSegmentsService,
  sourceExcerptParaphrasesDao,
  sourceExcerptParaphrase
) {
  return sourceExcerptParaphrasesDao.readSourceExcerptParaphraseForId(sourceExcerptParaphrase.id)
    .then( (dbSourceExcerptParaphrase) => {
      return Promise.all([
        statementsService.readStatementForId(dbSourceExcerptParaphrase.paraphrasingStatement.id),
        getSourceExcerptEntity(writQuotesService, picRegionsService, vidSegmentsService,
          dbSourceExcerptParaphrase.type, dbSourceExcerptParaphrase.entity.id)
      ])
    })
}

function getSourceExcerptEntity(
  writQuotesService,
  picRegionsService,
  vidSegmentsService,
  sourceExcerptType,
  sourceExcerptEntityId
) {
  switch (sourceExcerptType) {
    case SourceExcerptType.WRIT_QUOTE:
      return writQuotesService.getWritQuoteForId(sourceExcerptEntityId)
    case SourceExcerptType.PIC_REGION:
      return picRegionsService.getPicRegionForId(sourceExcerptEntityId)
    case SourceExcerptType.VID_SEGMENT:
      return vidSegmentsService.getVidSegmentForId(sourceExcerptEntityId)
    default:
      throw newImpossibleError(`Impossible SourceExcerptType: ${sourceExcerptType}`)
  }
}


function getOrCreateSourceExcerptParaphrase(
  logger,
  statementsService,
  writQuotesService,
  picRegionsService,
  vidSegmentsService,
  sourceExcerptParaphrasesDao,
  sourceExcerptParaphrase,
  userId,
  now
) {
  if (sourceExcerptParaphrase.id) {
    return this.sourceExcerptParaphrasesDao.readSourceExcerptParaphraseForId(sourceExcerptParaphrase.id)
      .then( (extantSourceExcerptParaphrase) => {
        if (extantSourceExcerptParaphrase) {
          return extantSourceExcerptParaphrase
        }

        logger.warning(`SourceExcerptParaphrase having ID ${sourceExcerptParaphrase.id} missing.  Getting or creating equivalent`)
        return getOrCreateEquivalentSourceExcerptParaphrase(
          logger,
          statementsService,
          writQuotesService,
          picRegionsService,
          vidSegmentsService,
          sourceExcerptParaphrasesDao,
          sourceExcerptParaphrase,
          userId,
          now
        )
      })
  }

  return getOrCreateEquivalentSourceExcerptParaphrase(
    logger,
    statementsService,
    writQuotesService,
    picRegionsService,
    vidSegmentsService,
    sourceExcerptParaphrasesDao,
    sourceExcerptParaphrase,
    userId,
    now
  )
}

function getOrCreateEquivalentSourceExcerptParaphrase(
  logger,
  statementsService,
  writQuotesService,
  picRegionsService,
  vidSegmentsService,
  sourceExcerptParaphrasesDao,
  sourceExcerptParaphrase,
  userId,
  now
) {
  const sourceExcerptType = sourceExcerptParaphrase.sourceExcerpt.type
  const sourceExcerptEntity = sourceExcerptParaphrase.sourceExcerpt.entity
  return Promise.all([
    statementsService.getOrCreateValidStatementAsUser(sourceExcerptParaphrase.paraphrasingStatement, userId, now),
    getOrCreateSourceExcerptEntity(sourceExcerptType, sourceExcerptEntity, writQuotesService, picRegionsService, vidSegmentsService),
  ])
    .then( ([
      {isExtant: isStatementExtant, statement},
      {isExtant: isSourceExcerptExtant, sourceExcerptEntity}
    ]) => {
      if (isStatementExtant && isSourceExcerptExtant) {
        const sourceExcerptType = sourceExcerptParaphrase.sourceExcerpt.type
        return sourceExcerptParaphrasesDao.readSourceExcerptHavingStatementIdAndSourceExcerptTypeAndId(statement.id,
          sourceExcerptType, sourceExcerptEntity.id)
          .then ( (extantSourceExcerptParaphrase) => {
            if (extantSourceExcerptParaphrase) {
              return extantSourceExcerptParaphrase
            }

            sourceExcerptParaphrase.paraphrasingStatement = statement
            sourceExcerptParaphrase.sourceExcerpt.entity = sourceExcerptEntity
            return this.sourceExcerptParaphrasesDao.createSourceExcerptParaphrase(sourceExcerptParaphrase, userId, now)
          })
      }
      sourceExcerptParaphrase.paraphrasingStatement = statement
      sourceExcerptParaphrase.sourceExcerpt.entity = sourceExcerptEntity
      return sourceExcerptParaphrasesDao.createSourceExcerptParaphrase(sourceExcerptParaphrase, userId, now)
    })
}

function getOrCreateSourceExcerptEntity(sourceExcerptType, sourceExcerptEntity, writQuotesService, picRegionsService, vidSegmentsService) {
  switch (sourceExcerptType) {
    case SourceExcerptType.WRIT_QUOTE:
      return writQuotesService.getOrCreateWritQuote(sourceExcerptEntity)
        .then( ({isExtant, writQuote: sourceExcerptEntity}) => ({isExtant, sourceExcerptEntity}) )
    case SourceExcerptType.PIC_REGION:
      return picRegionsService.getOrCreatePicRegion(sourceExcerptEntity)
        .then( ({isExtant, picRegion: sourceExcerptEntity}) => ({isExtant, sourceExcerptEntity}) )
    case SourceExcerptType.VID_SEGMENT:
      return vidSegmentsService.getOrCreateVidSegment(sourceExcerptEntity)
        .then( ({isExtant, vidSegment: sourceExcerptEntity}) => ({isExtant, sourceExcerptEntity}) )
    default:
      throw newImpossibleError(`Impossible SourceExcerptType: ${sourceExcerptType}`)
  }
}
