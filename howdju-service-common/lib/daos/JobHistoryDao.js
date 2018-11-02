const {
  mapSingle,
} = require('./daosUtil')
const {
  toJobHistory
} = require('./orm')

exports.JobHistoryDao = class JobHistoryDao {

  constructor(logger, database) {
    this.logger = logger
    this.database = database
  }

  createJobHistory(jobType, jobScope, startedAt) {
    return this.database.query(
      'createJobHistory',
      `insert into job_history (job_type, job_scope, started_at) 
       values ($1, $2, $3)
       returning *`, [jobType, jobScope, startedAt])
      .then(mapSingle(this.logger, toJobHistory, 'job_history', {jobType, jobScope, startedAt}))
  }

  updateJobCompleted(jobHistory, jobStatus, completedAt, message) {
    return this.database.query(
      'updateJobCompleted',
      `update job_history set status = $1, completed_at = $2, message = $3 where job_history_id = $4`,
      [jobStatus, completedAt, message, jobHistory.id]
    )
  }
}
