import {
  ActionSubjectType,
  ActionTargetType,
  ActionType,
  EntityId,
} from "howdju-common";
import { Moment } from "moment";
import { ActionsDao } from "..";

export class ActionsService {
  actionsDao: ActionsDao;
  constructor(actionsDao: ActionsDao) {
    this.actionsDao = actionsDao;
  }

  asyncRecordAction(
    userId: EntityId,
    now: Moment,
    actionType: ActionType,
    actionTargetType: ActionTargetType,
    targetEntityId: EntityId,
    actionSubjectType?: ActionSubjectType,
    subjectEntityId?: EntityId
  ) {
    // Don't return the promise to prevent accidental synchronizing on it
    void this.recordAction(
      userId,
      now,
      actionType,
      actionTargetType,
      targetEntityId,
      actionSubjectType,
      subjectEntityId
    );
  }

  recordAction(
    userId: EntityId,
    now: Moment,
    actionType: ActionType,
    actionTargetType: ActionTargetType,
    targetEntityId: EntityId,
    actionSubjectType?: ActionSubjectType,
    subjectEntityId?: EntityId
  ) {
    return this.actionsDao.createAction(
      userId,
      actionType,
      targetEntityId,
      actionTargetType,
      now,
      actionSubjectType,
      subjectEntityId
    );
  }
}
