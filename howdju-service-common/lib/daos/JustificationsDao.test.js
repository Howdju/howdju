const assign = require('lodash/assign')
const moment = require('moment')
const sinon = require('sinon')

const {
  JustificationRootTargetType,
  JustificationPolarity,
  JustificationTargetType,
  JustificationBasisType,
} = require('howdju-common')

const {JustificationsDao} = require('./JustificationsDao')
const {
  mockLogger
} = require('howdju-test-common')

describe('createJustification', () => {
  test('creates a statement justification', () => {
    const rootTargetType = JustificationRootTargetType.STATEMENT
    const rootTargetId = "1"
    const polarity = JustificationPolarity.NEGATIVE
    const targetType = JustificationTargetType.STATEMENT
    const targetId = rootTargetId
    const basisType = JustificationBasisType.PROPOSITION_COMPOUND
    const basisId = "2"
    const userId = "4"
    const now = moment()
    const justification = {
      rootTargetType,
      rootTarget: {id: rootTargetId},
      polarity,
      target: {
        type: targetType,
        entity: {id: targetId},
      },
      basis: {
        type: basisType,
        entity: {id: basisId},
      }
    }
    const rootPolarity = polarity
    const justificationId = "3"
    const expectedJustification = assign({}, justification, {
      id: justificationId,
      counterJustifications: [],
      creator: expect.objectContaining({id: userId}),
      created: now,
      rootPolarity,
      rootTarget: expect.objectContaining(justification.rootTarget),
    })
    const database = {
      query: sinon.fake((id, sql, args) => {
        switch (id) {
          case 'createJustification': {
            return {
              rows: [{
                justification_id: justificationId,
                root_target_type: rootTargetType,
                root_target_id: rootTargetId,
                root_polarity: rootPolarity,
                target_type: targetType,
                target_id: targetId,
                basis_type: basisType,
                basis_id: basisId,
                polarity: polarity,
                creator_user_id: userId,
                created: now,
              }],
            }
          }
        }
      }),
    }
    const emptyDependency = {}
    const justificationsDao = new JustificationsDao(mockLogger, database, emptyDependency, emptyDependency, emptyDependency, emptyDependency)

    return justificationsDao.createJustification(justification, userId, now).then((result) => {
      return expect(result).toEqual(expect.objectContaining(expectedJustification))
    })
  })
})