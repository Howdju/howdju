const axiosInstance = {request: jest.fn()}
import Axios from 'axios'
Axios.create = () => axiosInstance

beforeEach(() => {
  axiosInstance.request.mockReset()
})

describe('api', () => {
  test('request', async () => {
    const propositions = [
      { id: 1, text: 'a proposition' },
      { id: 2, text: 'another proposition' },
    ]
    const api = await import('./api')
    axiosInstance.request.mockImplementation(() => Promise.resolve({
      data: propositions,
    }))

    const result = await api.request({endpoint: 'blah'})

    expect(result).toEqual(propositions)
  })
})
