yarn workspaces foreach -Apv run lint || {
  echo "lint failed"
  exit 1
}
