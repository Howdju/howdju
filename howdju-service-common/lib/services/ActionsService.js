exports.ActionsService = class ActionsService {

  constructor(actionsDao) {
    this.actionsDao = actionsDao
  }

  asyncRecordAction(userId, now, actionType, actionTargetType, targetEntityId, actionSubjectType, subjectEntityId) {
    // Don't return the promise to prevent accidental synchronizing on it
    this.recordAction(userId, now, actionType, actionTargetType, targetEntityId, actionSubjectType, subjectEntityId)
  }

  recordAction(userId, now, actionType, actionTargetType, targetEntityId, actionSubjectType, subjectEntityId) {
    return this.actionsDao.createAction(userId, actionType, targetEntityId, actionTargetType, now, actionSubjectType, subjectEntityId)
  }
}
