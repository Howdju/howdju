const joinStrings = (arr, separator) => {
  if (arr.length === 0) return ""
  return arr.reduce((v1, v2) => `${v1}${separator}${v2}`)
}

exports.CircularReferenceDetector = class CircularReferenceDetector {

  constructor(logger) {
    this.logger = logger
  }

  detectCircularReferences(toBeStringifiedValue, serializationKeyStack = []) {
    Object.keys(toBeStringifiedValue).forEach(key => {
      let value = toBeStringifiedValue[key]

      let serializationKeyStackWithNewKey = serializationKeyStack.slice()
      serializationKeyStackWithNewKey.push(key)
      try {
        JSON.stringify(value)
      } catch (error) {
        this.logger.debug(`path "${joinStrings(serializationKeyStack)}" JSON.stringify results in error: ${error}`)

        let isCircularValue
        let circularExcludingStringifyResult = ""
        try {
          circularExcludingStringifyResult = JSON.stringify(value, this.replaceRootStringifyReplacer(value), 2)
          isCircularValue = true
        } catch (error) {
          this.logger.debug(`path "${joinStrings(serializationKeyStack)}" is not the circular source`)
          this.detectCircularReferences(value, serializationKeyStackWithNewKey)
          isCircularValue = false
        }
        if (isCircularValue) {
          throw new Error('Circular reference detected:\n' +
            `  Circularly referenced value is value under path "${joinStrings(serializationKeyStackWithNewKey)}" of the given root object` +
            `  Calling stringify on this value but replacing itself with [Circular object --- fix me] ( <-- search for this string) results in:\n` +
            `  ${circularExcludingStringifyResult}`)
        }
      }
    })
  }

  replaceRootStringifyReplacer(toBeStringifiedValue) {
    let serializedObjectCounter = 0

    return function (key, value) {
      if (serializedObjectCounter !== 0 && typeof(toBeStringifiedValue) === 'object' && toBeStringifiedValue === value) {
        this.logger.error(`object serialization with key ${key} has circular reference to being stringified object`)
        return '[Circular object --- fix me]'
      }

      serializedObjectCounter++

      return value
    }
  }
}
