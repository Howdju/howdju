// Must occur before loading db methods
const env = require('node-env-file')
const path = require('path')
const envFilename = process.env.NODE_ENV === 'production' ? '../../config/production.env' : '../../src/.env'
env(path.join(__dirname, envFilename))