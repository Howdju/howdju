const debug = require('debug')('app:server')
const express = require('express')
const morgan = require('morgan')
const path = require('path')
const projectConfig = require('./config/project.config')
const webpack = require('webpack')
const webpackConfig = require('./config/webpack.config')


const statements = [
      {
        id: 1,
        slug: 'the-american-health-care-reform-act-of-2017',
        text: "The American Health Care Reform Act of 2017 (H.R.277) is an improvement over The Affordable Care Act",
      },
    ]

const justifications = [
  {
    id: 1,
    target: { type: 'STATEMENT', entity: { id: 1 } },
    basis: { type: 'STATEMENT', entity: { id: 2, text: "The American Health Care Reform Act of 2017 will reduce federal deficits by $337 by 2026" } },
    polarity: 'POSITIVE',
    score: 1,
  },
  {
    id: 2,
    target: { type: 'STATEMENT', entity: { id: 1 } },
    basis: { type: 'STATEMENT', entity: { id: 3, text: "The AHCA will uninsure 14 million people by 2018"} },
    polarity: 'NEGATIVE',
    score: 2,
  },
  {
    id: 3,
    target: { type: 'STATEMENT', entity: { id: 1 } },
    basis: { type: 'STATEMENT', entity: { id: 4, text: "The AHCA is shorter than the ACA"} },
    polarity: 'POSITIVE',
    score: 3,
  },
  {
    id: 4,
    target: { type: 'STATEMENT', entity: { id: 1 } },
    basis: { type: 'STATEMENT', entity: { id: 5, text: "The AHCA removes the penalty for choosing not to have health insurance"} },
    polarity: 'POSITIVE',
    score: 4,
  },
  {
    id: 5,
    target: { type: 'STATEMENT', entity: { id: 1 } },
    basis: { type: 'STATEMENT', entity: { id: 6, text: "The removal of the individual mandate will drive up insurance costs and emergency care costs"} },
    polarity: 'NEGATIVE',
    score: 5,
  },
  {
    id: 6,
    target: { type: 'STATEMENT', entity: { id: 1 } },
    basis: {
      type: 'REFERENCE',
      entity: {
        id: 1,
        quote: 'Generally, people who are older, lower-income, or live in high-premium areas (like Alaska and Arizona) ' +
        'receive larger tax credits under the ACA than they would under the American Health Care Act replacement.',
        citation: {
          id: 1,
          text: 'Tax Credits under the Affordable Care Act vs. the American Health Care Act: An Interactive Map',
        },
        urls: [
          {
            id: 1,
            url: 'http://kff.org/interactive/tax-credits-under-the-affordable-care-act-vs-replacement-proposal-interactive-map/'
          },
        ]
      }
    },
    polarity: 'NEGATIVE',
    score: 6,
  }
]

const app = express()

app.use(morgan('dev'))

const compiler = webpack(webpackConfig)
debug('Enabling webpack dev and HMR middleware')
app.use(require('webpack-dev-middleware')(compiler, {
  publicPath  : webpackConfig.output.publicPath,
  contentBase : projectConfig.paths.src(),
  hot         : true,
  // quiet       : project.compilerQuiet,
  // noInfo      : project.compilerQuiet,
  lazy        : false,
  stats       : projectConfig.compilerStats
}))
app.use(require('webpack-hot-middleware')(compiler, {
  path: '/__webpack_hmr'
}))

app.use(express.static(projectConfig.paths.public()))
app.use(express.static(projectConfig.paths.dist()))

app.use('/api/statements', function (req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(statements));
})
app.use('/api/statement/1', function (req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({
    statement: statements[0],
    justifications: justifications
  }));
})

app.use('*', function (req, res) {
  res.sendFile(projectConfig.paths.dist('index.html'))
})

module.exports = app
