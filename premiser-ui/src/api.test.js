import Promise from 'bluebird'
import { normalize } from 'normalizr'
import { statementsSchema } from './schemas'

const axiosInstance = {request: jest.fn()}
import Axios from 'axios'
Axios.create = () => axiosInstance

beforeEach(() => {
  axiosInstance.request.mockReset()
})

describe('api', () => {
  test('request', done => {
    const statements = [
      { id: 1, text: 'a statement' },
      { id: 2, text: 'another statement' }
    ]
    return Promise.all([import('./api')]).then(([api]) => {

      axiosInstance.request.mockImplementation(() => Promise.resolve({
        data: statements
      }))

      return api.request({endpoint: 'blah', schema: statementsSchema}).then( (result) => {
        expect(result).toEqual(normalize(statements, statementsSchema))
      })
    })
      .catch().then(() => done())
  })
})