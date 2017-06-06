const {routes, selectRoute} = require('./route')
const _ = require('lodash')
const httpMethods = require('./httpMethods')
const {
  UserActionsConflictError,
} = require('./errors')

describe('routes', () => {

  test('readStatement route path should match a statement path', done => {
    const path = 'statements/2'
    const method = httpMethods.GET
    const queryStringParameters = {}
    selectRoute({path, method, queryStringParameters}).then( ({route, pathParameters}) => {
      expect(route.id).toBe('readStatement')
      expect(pathParameters).toEqual(["2"])
      done()
    })
  })

  test('readStatementJustifications route path should match a statement justifications path', done => {
    const path = 'statements/2'
    const method = httpMethods.GET
    const queryStringParameters = {include: 'justifications'}
    selectRoute({path, method, queryStringParameters}).then( ({route, pathParameters}) => {
      expect(route.id).toBe('readStatementJustifications')
      expect(pathParameters).toEqual(["2"])
      done()
    })
  })
})
