import {extension as ext} from 'howdju-client-common'

const optionDefinitions = {
  howdjuBaseUrl: {
    storageArea: 'local',
    default: 'https://www.howdju.com',
    defaultOnFalsey: true,
  }
}

export function getOptions(keys, cb) {
  // TODO group options by storageArea and request all from same storageArea at same time
  // (current approach might have network latency issues for sync settings.)
  const options = {}
  keys.forEach((key) => {
    getOption(key, (value) => {
      options[key] = value
    })
  })
  cb(options)
}

export function getOption(key, cb) {
  const optionDefinition = optionDefinitions[key]
  ext.storage[optionDefinition['storageArea']].get([key], function(items) {
    let value = items[key]
    if (value === undefined || optionDefinition['defaultOnFalsey'] && !value) {
      value = optionDefinitions[key]['default']
    }
    cb(value)
  })
}
