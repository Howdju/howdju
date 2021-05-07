# TODO add flow typechecking
yarn workspaces foreach -p run test || {
  echo "tests failed"
  exit 1
}
