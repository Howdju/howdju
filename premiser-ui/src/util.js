import get from 'lodash/get'
import validUrl from 'valid-url'
import isValidDomain from 'is-valid-domain'

import {
  isDefined,
  extractDomain,
} from 'howdju-common'

import config from './config'

export const isWindowNarrow = () => {
  return window.innerWidth < config.ui.narrowBreakpoint
}

/** Is it something handheldy that rotates? */
export const isDevice = () => isDefined(window.orientation)

export const isScreenPortrait = () => {
  const orientationType = get(window, ['screen', 'orientation', 'type'])
  if (orientationType) {
    return /portrait/.test(orientationType)
  } else if (isDefined(window.orientation)) {
    return window.orientation === 0 || window.orientation === 180
  } else {
    return window.innerWidth > window.innerHeight
  }
}

export const isScrollPastTop = () => window.document.body.scrollTop < 0

export const isScrollPastBottom = () => {
  // Some references for figuring this issue out:
  // https://stackoverflow.com/a/40370876/39396
  // https://stackoverflow.com/a/27335321/39396
  const body = window.document.body
  return body.scrollTop + window.innerHeight > body.scrollHeight
}

export const getDimensionInfo = () => {
  const {
    documentElement,
    body
  } = window.document
  const dimensionInfo = {
    window: {
      innerHeight: window.innerHeight,
      outerHeight: window.outerHeight,
      pageYOffset: window.pageYOffset,
      scrollY: window.scrollY,
    },
    documentElement: {
      scrollTop: documentElement.scrollTop,
      scrollHeight: documentElement.scrollHeight,
      clientHeight: documentElement.clientHeight,
      offsetHeight: documentElement.offsetHeight,
    },
    body: {
      scrollTop: body.scrollTop,
      clientHeight: body.clientHeight,
      offsetHeight: body.offsetHeight,
      scrollHeight: body.scrollHeight,
    },
    conditions: {
      [`window.innerHeight + window.pageYOffset >= document.body.offsetHeight : ${window.innerHeight} + ${window.pageYOffset} = ${window.innerHeight + window.pageYOffset} >= ${document.body.offsetHeight}`]: (window.innerHeight + window.pageYOffset >= document.body.offsetHeight),
      [`documentElement.clientHeight + window.pageYOffset >= document.body.offsetHeight : ${documentElement.clientHeight} + ${window.pageYOffset} = ${documentElement.clientHeight + window.pageYOffset} >= ${document.body.offsetHeight}`]: (documentElement.clientHeight + window.pageYOffset >= document.body.offsetHeight),
      [`body.scrollTop + window.innerHeight >= body.scrollHeight : ${body.scrollTop} + ${window.innerHeight} = ${body.scrollTop + window.innerHeight} >= body.scrollHeight`]: body.scrollTop + window.innerHeight >= body.scrollHeight,
    }
  }
  return dimensionInfo
}

export function isValidUrl(value) {
  return !!validUrl.isUri(value)
}

export function hasValidDomain(url) {
  const domain = extractDomain(url)
  if (!domain) return false
  return isValidDomain(domain)
}

export function isWikipediaUrl(url) {
  const domain = extractDomain(url)
  return domain.endsWith('wikipedia.org')
}

export function isTwitterUrl(url) {
  const domain = extractDomain(url)
  return domain.endsWith('twitter.com')
}