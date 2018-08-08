const isObject = require('lodash/isObject')
const map = require('lodash/map')
const toString = require('lodash/toString')

const toFlatJson = (obj) => JSON.stringify(obj)

/*
 There are three intended logging patterns:

 1. (data: object)
 2. (message: string, data: object=null)
 3. (message: string, data: object, extra: string|object...)

 In 1 and 2, the arguments become the return values `message` and `data` as named above.
 For the third pattern, the message will be the strings and JSONified objects joined in order by spaces.
 The data will be an array of the objects in the order they appeared in the arguments.
 */
const processArgs = (args, doUseCarriageReturns) => {
  const messageParts = []
  let datas = []
  let hasInterleavedMessageAndData = false
  for (const arg of args) {
    if (isObject(arg)) {
      if (hasInterleavedMessageAndData) {
        messageParts.push(toFlatJson(arg))
      }
      datas.push(arg)
    } else {
      if (datas.length > 0 && !hasInterleavedMessageAndData) {
        hasInterleavedMessageAndData = true

        // If the args have interleaved strings and objects, then the objects' JSON should be included in the message
        // Add all the previously seen objects

        const datasJson = map(datas, toFlatJson)
        const spliceArgs = [messageParts.length, 0].concat(datasJson)
        messageParts.splice.apply(messageParts, spliceArgs)
      }
      messageParts.push(toString(arg))
    }
  }

  let message = null
  if (messageParts.length > 0) {
    message = messageParts.join(' ')
    if (doUseCarriageReturns) {
      message = message.replace('\n', '\r')
    }
  }

  let data = null
  if (datas.length === 1) {
    data = datas[0]
  } else if (datas.length > 1) {
    data = datas
  }

  return {
    message,
    data,
  }
}

exports.processArgs = processArgs