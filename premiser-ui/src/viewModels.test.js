import {
  combineIds,
  combineNames,
  array,
} from './viewModels'

describe('combineIds', () => {
  test('joins IDs', () => {
    expect(combineIds('a', 'b')).toBe('a--b')
    expect(combineIds('a', 'b', 'c')).toBe('a--b--c')
  })
})

describe('combineNames', () => {
  test('joins names', () => {
    expect(combineNames('foo', 'bar')).toBe('foo.bar')
    expect(combineNames('foo', 'bar', 'caz')).toBe('foo.bar.caz')
    expect(combineNames('foo', array(2), 'bar')).toBe('foo[2].bar')
  })
})
