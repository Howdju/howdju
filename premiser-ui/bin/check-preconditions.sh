
script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

[[ -z $(git status -s "$script_dir"/..) ]] || {
  echo "There are uncommitted changes."
  exit 1
}
