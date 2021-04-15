import "core-js/modules/es.promise"
// import Promise from "core-js/es/promise"

const axiosInstance = {request: jest.fn()}
import Axios from 'axios'
Axios.create = () => axiosInstance

beforeEach(() => {
  axiosInstance.request.mockReset()
})

describe('api', () => {
  test('request', () => {
    const propositions = [
      { id: 1, text: 'a proposition' },
      { id: 2, text: 'another proposition' }
    ]
    return Promise.all([import('./api')])
      .then(([api]) => {

        axiosInstance.request.mockImplementation(() => Promise.resolve({
          data: propositions
        }))

        return api.request({endpoint: 'blah'})
      })
      .then( (result) => {
        expect(result).toEqual(propositions)
      })
  })
})
