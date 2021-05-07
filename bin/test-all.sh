yarn workspaces foreach -Apv run test || {
  echo tests failed
  exit 1
}
echo test succeeded
