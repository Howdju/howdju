const {
  cleanWhitespace,
  omitDeep,
} = require('./general')

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

describe('omitDeep', () => {
  test('omits deeply', () => {
    const toOmit = {}

    const value = {
      foo: 'bar',
      hello: {
        world: 'now',
        goodbye: toOmit,
      },
      arr: [1, toOmit, 2, 3],
    }
    expect(omitDeep(value, (val) => val === toOmit)).toEqual({
      foo: 'bar',
      hello: {
        world: 'now'
      },
      arr: [1, 2, 3],
    })
  })
})