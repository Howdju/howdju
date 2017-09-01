import { normalize } from 'normalizr'
import { statementsSchema } from './schemas'

jest.mock('axios')

beforeEach(done => {
  import('axios').then(axios => {
    axios.mockReset()
    done()
  })
})

describe('api', () => {
  test('fetchStatements', done => {
    const statements = [
      { id: 1, text: 'a statement' },
      { id: 2, text: 'another statement' }
    ]
    Promise.all([import('axios'), import('./api')]).then( ([axios, api]) => {

      fetch.mockImplementation( () => Promise.resolve({
        ok: true,
        headers: {
          get: headerName => 'application/json'
        },
        json: () => Promise.resolve(statements),
      }) )

      api.fetchJson('blah', {schema: statementsSchema}).then( (result) => {
        expect(result).toEqual(normalize(statements, statementsSchema))
        done()
      })
    })
  })
})