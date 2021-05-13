const {
  normalizeText,
  addArrayParams,
} = require('./daosUtil')

describe('normalizeText', () => {
  test('Should normalize burred characters', () => {
    expect(normalizeText('Thîs will be nörmalized?')).toBe('this will be normalized')
  })
  test('Should normalize punctuation', () => {
    expect(normalizeText('This will be “normalized?”')).toBe('this will be normalized')
  })
  test('Should condense acronyms using periods', () => {
    expect(normalizeText('Washington, D.C. is the best state')).toBe('washington dc is the best state')
  })
})

describe('addArrayParams', () => {
  test('should work', () => {
    expect(addArrayParams(['a', 'b'], ['c', 'd'])).toStrictEqual({
      args: ['a', 'b', 'c', 'd'],
      params: ['$3', '$4'],
    })
  })
})
