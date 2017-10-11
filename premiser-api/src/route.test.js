const {selectRoute} = require('./route')
const {
  httpMethods,
  NoMatchingRouteError,
} = require('howdju-common')

describe('routes', () => {

  test('readStatement route path should match a statement path', done => {
    const path = 'statements/2'
    const method = httpMethods.GET
    const queryStringParameters = {}
    selectRoute({path, method, queryStringParameters})
      .then( ({route, pathParameters}) => {
        expect(route.id).toBe('readStatement')
        expect(pathParameters).toEqual(["2"])
        return done()
      })
  })

  test('readStatementJustifications route path should match a statement justifications path', done => {
    const path = 'statements/2'
    const method = httpMethods.GET
    const queryStringParameters = {include: 'justifications'}

    expect.assertions(2)
    return selectRoute({path, method, queryStringParameters})
      .then( ({route, pathParameters}) => {
        expect(route.id).toBe('readStatementJustifications')
        expect(pathParameters).toEqual(["2"])
        return done()
      })
  })

  test('readTaggedStatements route path should match a tagged statements path', done => {
    const path = 'statements'
    const method = httpMethods.GET
    const queryStringParameters = {tagId: '42'}

    expect.assertions(1)
    return selectRoute({path, method, queryStringParameters})
      .then( ({route}) => {
        expect(route.id).toBe('readTaggedStatements')
        return done()
      })
  })

  test('readTaggedStatements route path should NOT match a non-tagged statements path', done => {
    const path = 'statements'
    const method = httpMethods.GET
    const queryStringParameters = {tag: '42'}

    expect.assertions(1)
    return selectRoute({path, method, queryStringParameters})
      .then( ({route}) => {
        expect(route.id).not.toBe('readTaggedStatements')
        return done()
      })
      .catch(error => {
        expect(error instanceof NoMatchingRouteError).toBe(true)
        return done()
      })
  })
})
