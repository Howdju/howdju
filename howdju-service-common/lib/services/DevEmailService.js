exports.DevEmailService = class DevEmailService {
  constructor(logger) {
    this.logger = logger
  }

  async sendEmail(emailParams) {
    this.logger.info('Dev email service simulating sending email', emailParams)
  }
}
