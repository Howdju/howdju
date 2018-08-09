const {selectRoute} = require('./route')
const {
  httpMethods,
} = require('howdju-common')

describe('routes', () => {

  test('readStatement route path should match a statement path', () => {
    const path = 'statements/2'
    const method = httpMethods.GET
    const queryStringParameters = {}

    const {route, routedRequest} = selectRoute({path, method, queryStringParameters})

    expect(route.id).toBe('readStatement')
    expect(routedRequest.pathParameters).toEqual(["2"])
  })

  test('readStatementJustifications route path should match a statement justifications path', () => {
    const path = 'statements/2'
    const method = httpMethods.GET
    const queryStringParameters = {include: 'justifications'}

    const {route, routedRequest} = selectRoute({path, method, queryStringParameters})
    expect(route.id).toBe('readStatementJustifications')
    expect(routedRequest.pathParameters).toEqual(["2"])
  })

  test('readTaggedStatements route path should match a tagged statements path', () => {
    const path = 'statements'
    const method = httpMethods.GET
    const queryStringParameters = {tagId: '42'}

    const {route} = selectRoute({path, method, queryStringParameters})

    expect(route.id).toBe('readTaggedStatements')
  })

  test('readTaggedStatements route path should NOT match a non-tagged statements path', () => {
    const path = 'statements'
    const method = httpMethods.GET
    const queryStringParameters = {tag: '42'}

    const {route} = selectRoute({path, method, queryStringParameters})
    expect(route.id).not.toBe('readTaggedStatements')
  })
})
