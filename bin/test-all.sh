# TODO add flow typechecking
yarn workspaces foreach -Apv run test || {
  echo "tests failed"
  exit 1
}
