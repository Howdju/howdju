import {fetchStatements} from './actions'

describe('actions', () => {
  it('should provide its name', () => {
    expect(fetchStatements.toString()).toBe('FETCH_STATEMENTS')
  })
  it('might use toString as object key', () => {
    expect({[fetchStatements]: true}).toEqual({FETCH_STATEMENTS: true})
  })
})