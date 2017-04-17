const {routes} = require('./route')
const _ = require('lodash')

describe('routes', () => {

  test('getStatement route', () => {
    const verifyJustificationRoute = _.find(routes, {id: 'getStatement'})
    const path = 'statements/2'
    expect(verifyJustificationRoute.path.test(path)).toBe(true)
  })
})
