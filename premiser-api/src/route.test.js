const {selectRoute} = require('./route')
const {httpMethods} = require('howdju-common')

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
    selectRoute({path, method, queryStringParameters})
      .then( ({route, pathParameters}) => {
        expect(route.id).toBe('readStatementJustifications')
        expect(pathParameters).toEqual(["2"])
        return done()
      })
  })
})
