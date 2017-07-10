const {normalizeText, cleanWhitespace} = require('./util')

describe('cleanWhitespace', () => {
  test('Should combine adjacent whitespace', () => {
    expect(cleanWhitespace('This     will   be     cleaned')).toBe('This will be cleaned')
  })
  test('Should replace whitespace with spaces', () => {
    expect(cleanWhitespace('This\t\twill\nbe\fcleaned')).toBe('This will be cleaned')
  })
  test('Should not change characters or capitalization', () => {
    expect(cleanWhitespace('This   wîll be   clëaned?')).toBe('This wîll be clëaned?')
  })
})

describe('normalizeText', () => {
  test('Should normalize burred characters', () => {
    expect(normalizeText('Thîs will be nörmalized?')).toBe('this will be normalized')
  })
  test('Should normalize punctuation', () => {
    expect(normalizeText('This will be “normalized?”')).toBe('this will be normalized')
  })
})
