/* This file must output something to be useful.  So a configured logger doesn't make sense */
/* eslint "no-console": ["off"] */

const {decodeContinuationToken} = require('../src/service')

console.log(decodeContinuationToken(process.argv[1]))
