import {
  isValidUrl,
  hasValidDomain,
  isWikipediaUrl,
  isTwitterUrl,
} from './util'

test('isValidUrl', () => {
  expect(isValidUrl('http://google.com/search?q=wittgenstein')).toBe(true)
  expect(isValidUrl('google.com/search?q=wittgenstein')).toBe(false)
})

test('hasValidDomain', () => {
  expect(hasValidDomain('http://www.legomyego.com')).toBe(true)
  expect(hasValidDomain('http://check*here')).toBe(false)
})

test('isWikipediaUrl', () => {
  expect(isWikipediaUrl('https://en.wikipedia.org/wiki/Epistemology')).toBe(true)
  expect(isWikipediaUrl('https://google.com/wiki/Epistemology')).toBe(false)
})

test('isTwitterUrl', () => {
  expect(isTwitterUrl('https://twitter.com/elonmusk')).toBe(true)
  expect(isTwitterUrl('https://google.com/elonmusk')).toBe(false)
})