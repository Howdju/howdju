import forEach from 'lodash/forEach'

import { newProgrammingError } from './commonErrors'
import { isDefined } from './general'


export function requireArgs(requiredArgs) {
  const missing = []
  forEach(requiredArgs, (value, name) => {
    if (!isDefined(value)) {
      missing.push(name)
    }
  })

  if (missing.length > 0) {
    throw newProgrammingError(`Required arguments are undefined: ${missing.join(', ')}`)
  }
  return true
}
