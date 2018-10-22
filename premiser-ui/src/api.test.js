import Promise from 'bluebird'
import { normalize } from 'normalizr'
import { propositionsSchema } from './schemas'

const axiosInstance = {request: jest.fn()}
import Axios from 'axios'
Axios.create = () => axiosInstance

beforeEach(() => {
  axiosInstance.request.mockReset()
})

describe('api', () => {
  test('request', done => {
    const propositions = [
      { id: 1, text: 'a proposition' },
      { id: 2, text: 'another proposition' }
    ]
    return Promise.all([import('./api')]).then(([api]) => {

      axiosInstance.request.mockImplementation(() => Promise.resolve({
        data: propositions
      }))

      return api.request({endpoint: 'blah', schema: propositionsSchema}).then( (result) => {
        expect(result).toEqual(normalize(propositions, propositionsSchema))
      })
    })
      .catch().then(() => done())
  })
})