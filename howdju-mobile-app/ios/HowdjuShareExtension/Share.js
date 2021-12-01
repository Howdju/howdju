var Share = function() {};

Share.prototype = {
    run: function(arguments) {
      try {
        arguments.completionFunction({
            "URL": document.URL,
            "selectedText": document.getSelection().toString(),
            "title": document.title
        });
      } catch (err) {
        arguments.completionFunction({
            "error": "an error"
        });
      }
    },
    finalize: function(arguments) {
//        alert("shared!");
    }
};

var ExtensionPreprocessingJS = new Share;
