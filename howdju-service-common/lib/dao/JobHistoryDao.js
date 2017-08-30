const head = require('lodash/head')

const {
  warnIfMultiple
} = require('./util')
const {
  toJobHistory
} = require('./orm')

module.exports = class JobHistoryDao {
  constructor(logger, query) {
    this.logger = logger
    this.query = query
  }

  lastRunForJobType(jobType) {
    return this.query('select * from job_history where job_type = $1 order by completed_at desc limit 1', [jobType])
        .then( ({rows}) => {
          warnIfMultiple(rows, 'job_history', {jobType})
          return toJobHistory(head(rows))
        })
  }
}
