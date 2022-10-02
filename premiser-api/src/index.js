// Replace node's built-in promise with Bluebird.
global.Promise=require("bluebird")
module.exports = require('./handler')
