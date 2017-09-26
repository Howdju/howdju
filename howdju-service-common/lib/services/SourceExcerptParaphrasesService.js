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
    statementsService,
    writQuotesService,
    picRegionsService,
    vidSegmentsService,
    sourceExcerptParaphrasesDao
  ) {
    requireArgs({
      logger,
      actionsService,
      statementsService,
      writQuotesService,
      picRegionsService,
      vidSegmentsService,
      sourceExcerptParaphrasesDao,
    })

    this.logger = logger
    this.actionsService = actionsService
    this.statementsService = statementsService
    this.writQuotesService = writQuotesService
    this.picRegionsService = picRegionsService
    this.vidSegmentsService = vidSegmentsService
    this.sourceExcerptParaphrasesDao = sourceExcerptParaphrasesDao
  }

  readSourceExcerptParaphraseForId(sourceExcerptParaphraseId, {userId}) {
    return readSourceExcerptParaphraseForId(
      this,
      sourceExcerptParaphraseId,
      userId
    )
  }

  readOrCreateValidSourceExcerptParaphraseAsUser(sourceExcerptParaphrase, userId, now) {
    return Promise.resolve()
      .then(() => {
        if (sourceExcerptParaphrase.id) {
          return Promise.props({
            isExtant: true,
            sourceExcerptParaphrase: this.readSourceExcerptParaphraseForId(sourceExcerptParaphrase.id),
          })
        }

        return readOrCreateEquivalentValidSourceExcerptParaphraseAsUser(this, sourceExcerptParaphrase, userId, now)
      })
  }
}

function readSourceExcerptParaphraseForId(
  service,
  sourceExcerptParaphraseId,
  userId
) {
  return service.sourceExcerptParaphrasesDao.readSourceExcerptParaphraseForId(sourceExcerptParaphraseId, {userId})
    .then( (sourceExcerptParaphrase) => Promise.all([
      sourceExcerptParaphrase,
      service.statementsService.readStatementForId(sourceExcerptParaphrase.paraphrasingStatement.id, {userId}),
      getSourceExcerptEntity(
        service,
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
  service,
  sourceExcerptType,
  sourceExcerptEntityId,
  userId
) {
  switch (sourceExcerptType) {
    case SourceExcerptType.WRIT_QUOTE:
      return service.writQuotesService.readWritQuoteForId(sourceExcerptEntityId, {userId})
    case SourceExcerptType.PIC_REGION:
      return service.picRegionsService.readPicRegionForId(sourceExcerptEntityId, {userId})
    case SourceExcerptType.VID_SEGMENT:
      return service.vidSegmentsService.readVidSegmentForId(sourceExcerptEntityId, {userId})
    default:
      throw newImpossibleError(`Impossible SourceExcerptType: ${sourceExcerptType}`)
  }
}

function readOrCreateEquivalentValidSourceExcerptParaphraseAsUser(
  service,
  sourceExcerptParaphrase,
  userId,
  now
) {
  const sourceExcerptType = sourceExcerptParaphrase.sourceExcerpt.type
  const sourceExcerptEntity = sourceExcerptParaphrase.sourceExcerpt.entity
  return Promise.all([
    service.statementsService.readOrCreateValidStatementAsUser(sourceExcerptParaphrase.paraphrasingStatement, userId, now),
    readOrCreateSourceExcerptEntity(service, sourceExcerptType, sourceExcerptEntity, userId, now),
  ])
    .then( ([
      {isExtant: isStatementExtant, statement},
      {isExtant: isSourceExcerptExtant, sourceExcerptEntity}
    ]) => {
      if (isStatementExtant && isSourceExcerptExtant) {
        service.logger.debug(`Found extant statement (ID ${statement.id}) and sourceExcerpt (ID ${sourceExcerptEntity.id}  Attempting to find extant sourceExcerptParaphrase from them.`)
        const sourceExcerptType = sourceExcerptParaphrase.sourceExcerpt.type
        return service.sourceExcerptParaphrasesDao.readSourceExcerptHavingStatementIdAndSourceExcerptTypeAndId(statement.id,
          sourceExcerptType, sourceExcerptEntity.id)
          .then ( (extantSourceExcerptParaphrase) => {
            if (extantSourceExcerptParaphrase) {
              service.logger.debug(`Found extant sourceExcerptParaphrase (ID: ${extantSourceExcerptParaphrase.id} based upon statement and sourceExcerpt`)
              extantSourceExcerptParaphrase.paraphrasingStatement = statement
              extantSourceExcerptParaphrase.sourceExcerpt.entity = sourceExcerptEntity
              return {
                isExtant: true,
                sourceExcerptParaphrase: extantSourceExcerptParaphrase
              }
            }

            service.logger.debug(`Did not find extant sourceExcerptParaphrase based upon statement and sourceExcerpt`)
            sourceExcerptParaphrase.paraphrasingStatement = statement
            sourceExcerptParaphrase.sourceExcerpt.entity = sourceExcerptEntity
            return service.sourceExcerptParaphrasesDao.createSourceExcerptParaphrase(sourceExcerptParaphrase, userId, now)
              .then( (sourceExcerptParaphrase) => {
                service.logger.debug(`Created sourceExcerptParaphrase (ID ${sourceExcerptParaphrase.id})`)
                return {
                  isExtant: false,
                  sourceExcerptParaphrase,
                }
              })
          })
      }
      sourceExcerptParaphrase.paraphrasingStatement = statement
      sourceExcerptParaphrase.sourceExcerpt.entity = sourceExcerptEntity
      return service.sourceExcerptParaphrasesDao.createSourceExcerptParaphrase(sourceExcerptParaphrase, userId, now)
        .then( (sourceExcerptParaphrase) => {
          service.logger.debug(`Created sourceExcerptParaphrase (ID ${sourceExcerptParaphrase.id})`)
          return {
            isExtant: false,
            sourceExcerptParaphrase,
          }
        })
    })
    .then( ({isExtant, sourceExcerptParaphrase}) => {
      const actionType = isExtant ? ActionType.TRY_CREATE_DUPLICATE : ActionType.CREATE
      service.actionsService.asyncRecordAction(userId, now, actionType, ActionTargetType.SOURCE_EXCERPT_PARAPHRASE,
        sourceExcerptParaphrase.id)

      return {
        isExtant,
        sourceExcerptParaphrase,
      }
    })
}

function readOrCreateSourceExcerptEntity(
  service,
  sourceExcerptType,
  sourceExcerptEntity,
  userId,
  now
) {
  switch (sourceExcerptType) {
    case SourceExcerptType.WRIT_QUOTE:
      return service.writQuotesService.readOrCreateWritQuoteAsUser(sourceExcerptEntity, userId, now)
        .then( ({isExtant, writQuote: sourceExcerptEntity}) => ({isExtant, sourceExcerptEntity}) )
    case SourceExcerptType.PIC_REGION:
      return service.picRegionsService.readOrCreatePicRegionAsUser(sourceExcerptEntity, userId, now)
        .then( ({isExtant, picRegion: sourceExcerptEntity}) => ({isExtant, sourceExcerptEntity}) )
    case SourceExcerptType.VID_SEGMENT:
      return service.vidSegmentsService.readOrCreateVidSegmentAsUser(sourceExcerptEntity, userId, now)
        .then( ({isExtant, vidSegment: sourceExcerptEntity}) => ({isExtant, sourceExcerptEntity}) )
    default:
      throw newImpossibleError(`Impossible SourceExcerptType: ${sourceExcerptType}`)
  }
}
