import {api} from './actions'

describe('actions', () => {
  it('should provide its name', () => {
    expect(api.fetchPropositions.toString()).toBe('API/FETCH_PROPOSITIONS')
  })
  it('might use toString as object key', () => {
    expect({[api.fetchPropositions]: true}).toEqual({'API/FETCH_PROPOSITIONS': true})
  })
})