const head = require('lodash/head')

const {
  warnIfMultiple
} = require('./util')
const {
  toJobHistory
} = require('./orm')

exports.JobHistoryDao = class JobHistoryDao {
  constructor(logger, database) {
    this.logger = logger
    this.database = database
  }

  lastRunForJobType(jobType) {
    return this.database.query('select * from job_history where job_type = $1 order by completed_at desc limit 1', [jobType])
      .then( ({rows}) => {
        warnIfMultiple(rows, 'job_history', {jobType})
        return toJobHistory(head(rows))
      })
  }
}
