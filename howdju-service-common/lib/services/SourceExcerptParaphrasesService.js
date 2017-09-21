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
    actionsService,
    sourceExcerptParaphrasesDao,
    statementsService,
    writQuotesService,
    picRegionsService,
    vidSegmentsService
  ) {
    requireArgs({
      logger,
      actionsService,
      sourceExcerptParaphrasesDao,
      statementsService,
      writQuotesService,
      picRegionsService,
      vidSegmentsService
    })

    this.logger = logger
    this.actionsService = actionsService
    this.sourceExcerptParaphrasesDao = sourceExcerptParaphrasesDao
    this.statementsService = statementsService
    this.writQuotesService = writQuotesService
    this.picRegionsService = picRegionsService
    this.vidSegmentsService = vidSegmentsService
  }

  readSourceExcerptParaphraseForId(sourceExcerptParaphraseId, {userId}) {
    return getSourceExcerptParaphrase(
      this.logger,
      this.statementsService,
      this.writQuotesService,
      this.picRegionsService,
      this.vidSegmentsService,
      this.sourceExcerptParaphrasesDao,
      sourceExcerptParaphraseId,
      userId
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

function getSourceExcerptParaphrase(
  logger,
  statementsService,
  writQuotesService,
  picRegionsService,
  vidSegmentsService,
  sourceExcerptParaphrasesDao,
  sourceExcerptParaphraseId,
  userId
) {
  return sourceExcerptParaphrasesDao.readSourceExcerptParaphraseForId(sourceExcerptParaphraseId, {userId})
    .then( (sourceExcerptParaphrase) => Promise.all([
      sourceExcerptParaphrase,
      statementsService.readStatementForId(sourceExcerptParaphrase.paraphrasingStatement.id, {userId}),
      getSourceExcerptEntity(
        writQuotesService,
        picRegionsService,
        vidSegmentsService,
        sourceExcerptParaphrase.sourceExcerpt.type,
        sourceExcerptParaphrase.sourceExcerpt.entity.id,
        userId
      )
    ]))
    .then( ([sourceExcerptParaphrase, paraphrasingStatement, sourceExcerptEntity]) => {
      sourceExcerptParaphrase.paraphrasingStatement = paraphrasingStatement
      sourceExcerptParaphrase.sourceExcerpt.entity = sourceExcerptEntity
      return sourceExcerptParaphrase
    })
}

function getSourceExcerptEntity(
  writQuotesService,
  picRegionsService,
  vidSegmentsService,
  sourceExcerptType,
  sourceExcerptEntityId,
  userId
) {
  switch (sourceExcerptType) {
    case SourceExcerptType.WRIT_QUOTE:
      return writQuotesService.readWritQuoteForId(sourceExcerptEntityId, {userId})
    case SourceExcerptType.PIC_REGION:
      return picRegionsService.readPicRegionForId(sourceExcerptEntityId, {userId})
    case SourceExcerptType.VID_SEGMENT:
      return vidSegmentsService.readVidSegmentForId(sourceExcerptEntityId, {userId})
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
    getOrCreateSourceExcerptEntity(sourceExcerptType, sourceExcerptEntity, userId, now, writQuotesService, picRegionsService, vidSegmentsService),
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
              extantSourceExcerptParaphrase.paraphrasingStatement = statement
              extantSourceExcerptParaphrase.sourceExcerpt.entity = sourceExcerptEntity
              return {
                isExtant: true,
                sourceExcerptParaphrase: extantSourceExcerptParaphrase
              }
            }

            sourceExcerptParaphrase.paraphrasingStatement = statement
            sourceExcerptParaphrase.sourceExcerpt.entity = sourceExcerptEntity
            return sourceExcerptParaphrasesDao.createSourceExcerptParaphrase(sourceExcerptParaphrase, userId, now)
              .then( (sourceExcerptParaphrase) => ({
                isExtant: false,
                sourceExcerptParaphrase,
              }))
          })
      }
      sourceExcerptParaphrase.paraphrasingStatement = statement
      sourceExcerptParaphrase.sourceExcerpt.entity = sourceExcerptEntity
      return sourceExcerptParaphrasesDao.createSourceExcerptParaphrase(sourceExcerptParaphrase, userId, now)
        .then( (sourceExcerptParaphrase) => ({
          isExtant: false,
          sourceExcerptParaphrase,
        }))
    })
}

function getOrCreateSourceExcerptEntity(sourceExcerptType, sourceExcerptEntity, userId, now, writQuotesService, picRegionsService, vidSegmentsService) {
  switch (sourceExcerptType) {
    case SourceExcerptType.WRIT_QUOTE:
      return writQuotesService.getOrCreateWritQuoteAsUser(sourceExcerptEntity, userId, now)
        .then( ({isExtant, writQuote: sourceExcerptEntity}) => ({isExtant, sourceExcerptEntity}) )
    case SourceExcerptType.PIC_REGION:
      return picRegionsService.getOrCreatePicRegionAsUser(sourceExcerptEntity, userId, now)
        .then( ({isExtant, picRegion: sourceExcerptEntity}) => ({isExtant, sourceExcerptEntity}) )
    case SourceExcerptType.VID_SEGMENT:
      return vidSegmentsService.getOrCreateVidSegmentAsUser(sourceExcerptEntity, userId, now)
        .then( ({isExtant, vidSegment: sourceExcerptEntity}) => ({isExtant, sourceExcerptEntity}) )
    default:
      throw newImpossibleError(`Impossible SourceExcerptType: ${sourceExcerptType}`)
  }
}
