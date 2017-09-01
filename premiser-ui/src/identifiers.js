// Levels of identifiers: LocalStorageID, Cookie ID, SessionCookieID, SessionStorageID, page load/app run ID ID, Request ID
import uuid from 'uuid'
import get from 'lodash/get'
import Cookies from 'js-cookie'

export const newId = () => uuid.v4()

export const pageLoadId = newId()

export const getOrCreateSessionStorageId = () => {
  let sessionStorageId = getSessionStorageId()
  if (!sessionStorageId) {
    sessionStorageId = createSessionStorageId()
  }
  return sessionStorageId
}

const createSessionStorageId = () => {
  if (window.sessionStorage) {
    const ssid = newId()
    window.sessionStorage.ssid = ssid
    return ssid
  }
}

export const getSessionStorageId = () => {
  return get(window, ['sessionStorage', 'ssid'])
}

export const getOrCreateSessionCookieId = () => {
  let sessionCookieId = getSessionCookieId()
  if (!sessionCookieId) {
    sessionCookieId = createSessionCookieId()
  }
  return sessionCookieId
}

const createSessionCookieId = () => {
  const scid = newId()
  Cookies.set('scid', scid)
  return scid
}

const getSessionCookieId = () => {
  return Cookies.get('scid')
}
