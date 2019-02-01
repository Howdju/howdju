module.exports.CommonPaths = class CommonPaths {
  confirmRegistration() {return '/complete-registration'}
  confirmPasswordReset() {return '/reset-password'}
}

module.exports.commonPaths = new module.exports.CommonPaths()
