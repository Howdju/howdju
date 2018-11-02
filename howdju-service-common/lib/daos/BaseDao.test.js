const {
  addPrefixes,
  START_PREFIX,
  STOP_PREFIX,
} = require('./BaseDao')

describe('addPrefixes', () => {
  test('adds prefixes', () => {
    const fields = [
      {name: 'id'},
      {name: START_PREFIX + 'my_prefix_'},
      {name: 'foo'},
      {name: STOP_PREFIX},
      {name: 'baz'},
    ]
    const row = {
      id: 1,
      [START_PREFIX + 'my_prefix_']: '',
      foo: 'bar',
      [STOP_PREFIX]: '',
      baz: 'spaz'
    }
    const expected = {
      id: 1,
      my_prefix_foo: 'bar',
      baz: 'spaz',
    }
    expect(addPrefixes(fields, row)).toEqual(expected)
  })
})