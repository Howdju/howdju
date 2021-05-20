// Babel runtime dependencies
import "core-js/stable"
import "regenerator-runtime/runtime"

import find from "lodash/find"
import forOwn from "lodash/forOwn"

import {decircularizeJustification, logger} from "howdju-common"
import {extension as ext, EXTENSION_MESSAGE_SOURCE, actions} from 'howdju-client-common'

import {annotateSelection, annotateTarget} from './annotate'
import {getFrameApi, showSidebar, toggleSidebar} from './sidebar'
import {getOption} from './options'
import {
  ANNOTATE_SELECTION,
  runCommandsWhenTabReloaded, RUN_COMMANDS,
  TOGGLE_SIDEBAR
} from "./messages"

const didLoadKey = 'HowdjuDidLoad'

const allowedOrigins = [
  'http://localhost:3000',
  'http://pre-prod-www.howdju.com/',
  'https://www.howdju.com',
]
let messageHandlerReady = false
let messageHandlerReadyCallbacks = []

if (!window[didLoadKey]) {
  logger.trace(`difficult addOnWindowMessageListener, ${window.document.title}`)
  ext.addRuntimeOnMessageListener(onRuntimeMessage)
  window.addEventListener("message", onWindowMessage, false)
  window[didLoadKey] = true
}

function onWindowMessage(event) {
  const {data, origin} = event
  if (!find(allowedOrigins, (ao) => ao === origin)) {
    logger.trace(`ignoring window message event from disallowed origin '${origin}'`, {event})
    return
  }

  routeWindowMessage(data)
}

function onRuntimeMessage(request, sender, callback) {
  try {
    routeRuntimeMessage(request, sender)
  } catch (err) {
    logger.error(err)
  }
  if (callback) callback()
}

function routeWindowMessage(action) {
  const {type, payload} = action
  if (!type) {
    logger.error(`window message lacked an action type: ${action}`)
  }
  let isRecognized = true
  switch (type) {
    case actions.str(actions.extension.highlightTarget):
      highlightTarget(payload)
      break
    case actions.str(actions.extension.messageHandlerReady):
      setMessageHandlerReady(true)
      break
    default:
      logger.error(`Unhandled window message: ${action}`)
      isRecognized = false
      break
  }
  if (isRecognized) {
    // Let the app know we got it
    postActionMessageToFrame(actions.extensionFrame.ackMessage())
  }
}

function highlightTarget({justification, writQuote, url}) {
  const {target} = url
  // When we reload the page in the callback below, we lose the sidebar.
  // So we ask the background script to call us when we have reloaded,
  // and we both 1) tell the sidebar to load the justification and 2)
  // annotate the target in the new page.
  justification = decircularizeJustification(justification)
  const commands = [
    {postActionMessageToFrame: {gotoJustification: [justification]}}
  ]
  if (target) {
    commands.push({annotateTarget: [target]})
  }
  ext.sendRuntimeMessage(runCommandsWhenTabReloaded(commands), () => {
    window.location.href = url.url
  })
}

function runCommands(commands) {
  for (const command of commands) {
    try {
      runCommand(command)
    } catch (err) {
      logger.error(`error running command:`, {command, err})
    }
  }
}

function runCommand(command){
  logger.trace(`difficult runCommand ${JSON.stringify({command})}`)
  forOwn(command, (value, key) => {
    switch (key) {
      case "postActionMessageToFrame":
        // We expect there to be a single key. But this is a convenient way to access it.
        forOwn(value, (value, key) => {
          const actionCreator = actions.extensionFrame[key]
          if (!actionCreator) {
            logger.error(`Unrecognized extensionFrame action: ${key}`)
            return
          }
          logger.trace(`difficult postActionMessageToFrame ${JSON.stringify({key, value})}`)
          postActionMessageToFrame(actionCreator.apply(actionCreator, value))
        })
        break
      case "annotateTarget":
        annotateTarget.apply(annotateTarget, value)
        break
      default:
        logger.error(`Unrecognized command ${key}`)
    }
  })
}

function routeRuntimeMessage(message, sender) {
  logger.debug('routeMessage:', {message, sender})
  switch (message.type) {
    case ANNOTATE_SELECTION:
      annotateSelectionAndEdit()
      break
    case TOGGLE_SIDEBAR:
      toggleSidebar()
      break
    case RUN_COMMANDS:
      logger.trace(`difficult RUN_COMMANDS ${JSON.stringify({message})}`)
      runCommands(message.payload.commands)
      break
    default:
      logger.log('Unrecognized message type:', message)
      break
  }
}

function annotateSelectionAndEdit() {
  const annotation = annotateSelection()
  postActionMessageToFrame(actions.extensionFrame.createJustification({
    content: annotation.getContent(),
    source: new Source(),
    target: annotation.target,
  }))
}

function postActionMessageToFrame(action) {
  getOption('howdjuBaseUrl', (baseUrl) => {
      logger.trace(`difficult postActionMessageToFrame ${JSON.stringify({action})}`)
    doWhenFrameMessageHandlerReady((frameApi) => {
      frameApi.postMessage({
        source: EXTENSION_MESSAGE_SOURCE,
        action
      }, baseUrl)
    })
    showSidebar()
  })
}

function doWhenFrameMessageHandlerReady(callback) {
  if (messageHandlerReady) {
    logger.trace('difficult doWhenFrameMessageHandlerReady.ready')
    const frameApi = getFrameApi()
    callback(frameApi)
  } else {
    logger.trace('difficult doWhenFrameMessageHandlerReady.notReady')
    messageHandlerReadyCallbacks.push(callback)
  }
}

function setMessageHandlerReady(isReady) {
  if (isReady) {
    logger.trace('difficult setMessageHandlerReady.ready')
    const frameApi = getFrameApi()
    for (const callback of messageHandlerReadyCallbacks) {
      try {
        callback(frameApi)
      } catch (err) {
        logger.error('Error while invoking message-handler-ready callback', err)
      }
    }
    messageHandlerReadyCallbacks = []
  }
  messageHandlerReady = isReady
}

class Source {
  constructor() {
    this.url = window.location.href
    this.title = document.title
  }
}
