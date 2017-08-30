const assign = require('lodash/assign')
module.exports = assign(
    {},
    require('./apiGateway'),
    require('./dao'),
    require('./service')
)
