var Share = function () {}

Share.prototype = {
  run: function (args) {
    console.log('Safari JavaScript Preprocessing run starting.')
    try {
      args.completionFunction({
        url: document.URL,
        selectedText: document.getSelection().toString(),
        title: document.title,
      })
      console.log('Safari JavaScript Preprocessing run succeeded.')
    } catch (err) {
      args.completionFunction({
        err: err,
        msg: 'Safari JavaScript Preprocessing run failed.',
      })
    }
  },
  finalize: function (args) {
    console.log('Safari JavaScript Preprocessing finalized.')
  },
}

// We must expose our object as ExtensionPreprocessingJS
// eslint-disable-next-line no-unused-vars
var ExtensionPreprocessingJS = new Share()
