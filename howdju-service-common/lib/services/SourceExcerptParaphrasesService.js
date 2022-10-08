const Promise = require('bluebird')

const {
  ActionTypes,
  ActionTargetTypes,
  requireArgs,
  SourceExcerptTypes,
  newImpossibleError,
} = require('howdju-common')

exports.SourceExcerptParaphrasesService = class SourceExcerptParaphrasesService {
  constructor(
    logger,
    actionsService,
    propositionsService,
    writQuotesService,
    picRegionsService,
    vidSegmentsService,
    sourceExcerptParaphrasesDao
  ) {
    requireArgs({
      logger,
      actionsService,
      propositionsService,
      writQuotesService,
      picRegionsService,
      vidSegmentsService,
      sourceExcerptParaphrasesDao,
    })

    this.logger = logger
    this.actionsService = actionsService
    this.propositionsService = propositionsService
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
      service.propositionsService.readPropositionForId(sourceExcerptParaphrase.paraphrasingProposition.id, {userId}),
      getSourceExcerptEntity(
        service,
        sourceExcerptParaphrase.sourceExcerpt.type,
        sourceExcerptParaphrase.sourceExcerpt.entity.id,
        userId
      )
    ]))
    .then( ([sourceExcerptParaphrase, paraphrasingProposition, sourceExcerptEntity]) => {
      sourceExcerptParaphrase.paraphrasingProposition = paraphrasingProposition
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
    case SourceExcerptTypes.WRIT_QUOTE:
      return service.writQuotesService.readWritQuoteForId(sourceExcerptEntityId, {userId})
    case SourceExcerptTypes.PIC_REGION:
      return service.picRegionsService.readPicRegionForId(sourceExcerptEntityId, {userId})
    case SourceExcerptTypes.VID_SEGMENT:
      return service.vidSegmentsService.readVidSegmentForId(sourceExcerptEntityId, {userId})
    default:
      throw newImpossibleError(`Impossible SourceExcerptTypes: ${sourceExcerptType}`)
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
    service.propositionsService.readOrCreateValidPropositionAsUser(sourceExcerptParaphrase.paraphrasingProposition, userId, now),
    readOrCreateSourceExcerptEntity(service, sourceExcerptType, sourceExcerptEntity, userId, now),
  ])
    .then( ([
      {isExtant: isPropositionExtant, proposition},
      {isExtant: isSourceExcerptExtant, sourceExcerptEntity}
    ]) => {
      if (isPropositionExtant && isSourceExcerptExtant) {
        service.logger.debug(`Found extant proposition (ID ${proposition.id}) and sourceExcerpt (ID ${sourceExcerptEntity.id}  Attempting to find extant sourceExcerptParaphrase from them.`)
        const sourceExcerptType = sourceExcerptParaphrase.sourceExcerpt.type
        // TODO(1,2,3): remove exception
        // eslint-disable-next-line promise/no-nesting
        return service.sourceExcerptParaphrasesDao.readSourceExcerptHavingPropositionIdAndSourceExcerptTypeAndId(proposition.id,
          sourceExcerptType, sourceExcerptEntity.id)
          .then ( (extantSourceExcerptParaphrase) => {
            if (extantSourceExcerptParaphrase) {
              service.logger.debug(`Found extant sourceExcerptParaphrase (ID: ${extantSourceExcerptParaphrase.id} based upon proposition and sourceExcerpt`)
              extantSourceExcerptParaphrase.paraphrasingProposition = proposition
              extantSourceExcerptParaphrase.sourceExcerpt.entity = sourceExcerptEntity
              return {
                isExtant: true,
                sourceExcerptParaphrase: extantSourceExcerptParaphrase
              }
            }

            service.logger.debug(`Did not find extant sourceExcerptParaphrase based upon proposition and sourceExcerpt`)
            sourceExcerptParaphrase.paraphrasingProposition = proposition
            sourceExcerptParaphrase.sourceExcerpt.entity = sourceExcerptEntity
            // TODO(1,2,3): remove exception
            // eslint-disable-next-line promise/no-nesting
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
      sourceExcerptParaphrase.paraphrasingProposition = proposition
      sourceExcerptParaphrase.sourceExcerpt.entity = sourceExcerptEntity
      // TODO(1,2,3): remove exception
      // eslint-disable-next-line promise/no-nesting
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
      const actionType = isExtant ? ActionTypes.TRY_CREATE_DUPLICATE : ActionTypes.CREATE
      service.actionsService.asyncRecordAction(userId, now, actionType, ActionTargetTypes.SOURCE_EXCERPT_PARAPHRASE,
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
    case SourceExcerptTypes.WRIT_QUOTE:
      return service.writQuotesService.readOrCreateWritQuoteAsUser(sourceExcerptEntity, userId, now)
        .then( ({isExtant, writQuote: sourceExcerptEntity}) => ({isExtant, sourceExcerptEntity}) )
    case SourceExcerptTypes.PIC_REGION:
      return service.picRegionsService.readOrCreatePicRegionAsUser(sourceExcerptEntity, userId, now)
        .then( ({isExtant, picRegion: sourceExcerptEntity}) => ({isExtant, sourceExcerptEntity}) )
    case SourceExcerptTypes.VID_SEGMENT:
      return service.vidSegmentsService.readOrCreateVidSegmentAsUser(sourceExcerptEntity, userId, now)
        .then( ({isExtant, vidSegment: sourceExcerptEntity}) => ({isExtant, sourceExcerptEntity}) )
    default:
      throw newImpossibleError(`Impossible SourceExcerptTypes: ${sourceExcerptType}`)
  }
}
