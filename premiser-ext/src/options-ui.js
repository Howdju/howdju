import {extension as ext} from 'howdju-client-common'

document.addEventListener('DOMContentLoaded', restoreOptions)
document.getElementById('save').addEventListener('click', saveOptions)
// document.getElementById('remove-howdju-base-url').addEventListener('click', (event) => removeOption(event, 'howdjuBaseUrl'))

function saveOptions(event) {
  event.preventDefault()
  const howdjuBaseUrl = document.getElementById('howdju-base-url').value
  const isDevelopment = document.getElementById('is-development').checked
  ext.storage.local.set({
    howdjuBaseUrl,
    isDevelopment,
  }, function() {
    flashStatus('Options saved.')
  })
}

function restoreOptions() {
  ext.storage.local.get(['howdjuBaseUrl', 'isDevelopment'], function(items) {
    if (items.howdjuBaseUrl) {
      document.getElementById('howdju-base-url').value = items.howdjuBaseUrl
    }
    document.getElementById('is-development').checked = items.isDevelopment
  })
}

// function removeOption(event, key) {
//   event.preventDefault()
//   ext.storage.local.remove(key)
//   const input = getInputForOptionKey(key)
//   input.value = ''
// }
//
// function getInputForOptionKey(key) {
//   const inputs = document.getElementsByTagName('input')
//   for (const input of inputs) {
//     if (input.getAttribute('data-option-key') === key) {
//       return input
//     }
//   }
//   return null
// }

function flashStatus(message, duration = 1500) {
  const status = document.getElementById('status')
  status.textContent = message
  setTimeout(function() {
    status.textContent = ''
  }, duration)
}
