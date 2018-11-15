const {
  convertRowToObject,
  START_PREFIX,
  STOP_PREFIX,
} = require('./BaseDao')

describe('convertRowToObject', () => {
  test('adds prefixes', () => {
    const fields = [
      {name: 'id'},
      {name: START_PREFIX + 'my_prefix_'},
      {name: 'foo'},
      {name: STOP_PREFIX},
      {name: 'baz'},
    ]
    const row = [
      1,
      '',
      'bar',
      '',
      'spaz'
    ]
    const expected = {
      id: 1,
      my_prefix_foo: 'bar',
      baz: 'spaz',
    }
    expect(convertRowToObject(fields, row)).toEqual(expected)
  })
  test('handles collisions', () => {
    const fields = [
      {name: START_PREFIX + 'prefix_'},
      {name: 'foo'},
      {name: START_PREFIX + 'prefix2_'},
      // collides with previous key foo: after it is prefixed
      {name: 'prefix_foo'},
    ]
    const row = [
      '',
      'foo',
      '',
      'bar',
    ]
    const expected = {
      prefix_foo: 'foo',
      prefix2_prefix_foo: 'bar',
    }
    expect(convertRowToObject(fields, row)).toEqual(expected)
  })
})