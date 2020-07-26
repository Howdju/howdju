module.exports.CommonPaths = class CommonPaths {
  confirmRegistration() {return '/complete-registration'}
  confirmPasswordReset() {return '/reset-password'}
  login() {return '/login'}
  requestPasswordReset() {return '/request-password-reset'}
}

module.exports.commonPaths = new module.exports.CommonPaths()
