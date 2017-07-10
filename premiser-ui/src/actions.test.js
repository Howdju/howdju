import {api} from './actions'

describe('actions', () => {
  it('should provide its name', () => {
    expect(api.fetchStatements.toString()).toBe('API/FETCH_STATEMENTS')
  })
  it('might use toString as object key', () => {
    expect({[api.fetchStatements]: true}).toEqual({'API/FETCH_STATEMENTS': true})
  })
})