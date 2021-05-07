yarn workspaces foreach -p run lint || {
  echo "lint failed"
  exit 1
}
