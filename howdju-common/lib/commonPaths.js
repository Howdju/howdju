// TODO(196): ensure that these paths follow a pattern compatible with the web app paths.
module.exports.CommonPaths = class CommonPaths {
  confirmRegistration() {
    return "/complete-registration";
  }
  confirmPasswordReset() {
    return "/reset-password";
  }
  login() {
    return "/login";
  }
  requestPasswordReset() {
    return "/request-password-reset";
  }
};

module.exports.commonPaths = new module.exports.CommonPaths();
