yarn workspaces foreach -Apv run lint || {
  echo lint failed
  exit 1
}
echo linting succeeded

yarn workspaces foreach -Apv run flow || {
  echo flow failed
  exit 1
}
echo flow succeeded
