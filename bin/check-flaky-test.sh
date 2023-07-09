#!/bin/bash

# Usage:
#   check-flaky-test.sh <total_runs> [<jest_args>]
#   check-flaky-test.sh <total_runs> <test_suite_pattern> [<jest_args>]
#   check-flaky-test.sh <total_runs> <test_suite_pattern> <test_name_pattern> [<jest_args>]
#
# Example:
#
# $ ../bin/check-flaky-test.sh 100 MediaExcerptsService 'readOrCreateMediaExcerpt re-uses related entities.' --ci --runInBand --coverage

total_runs=$1
if [[ -n $2 ]] && [[ $2 != "--"* ]]; then
  test_suite_pattern=$2
  shift
else
  test_suite_pattern=""
fi
if [[ -n $2 ]] && [[ $2 != "--"* ]]; then
  test_name_pattern=$2
  shift
else
  test_name_pattern=""
fi

run_count=0
failure_count=0

if [[ -n $test_name_pattern ]]; then
  echo Running $total_runs times: yarn run test "'$test_suite_pattern'" --testNamePattern="'$test_name_pattern'" "${@:2}"
elif [[ -n $test_suite_pattern ]]; then
  echo Running $total_runs times: yarn run test "'$test_suite_pattern'" "${@:2}"
else
  echo Running $total_runs times: yarn run test "${@:2}"
fi

while [[ $run_count -lt $total_runs ]]; do
  run_count=$((run_count+1))
  echo -en "\r\033[KRun $run_count/$total_runs ($failure_count failures)"
  if [[ -n $test_name_pattern ]]; then
    output=$(yarn run test "$test_suite_pattern" --testNamePattern="$test_name_pattern" "${@:2}" 2>&1)
  elif [[ -n $test_suite_pattern ]]; then
    output=$(yarn run test "$test_suite_pattern" "${@:2}" 2>&1)
  else
    output=$(yarn run test "${@:2}" 2>&1)
  fi
  status=$?

  zero_suite_pattern="Test Suites: .* 0 of .* total"
  if [[ $output =~ $zero_suite_pattern ]]; then
    failure_count=$((failure_count+1))
    echo -e "\r\033[KRun $run_count/$total_runs ($failure_count failures)"
    echo "Pattern '$test_name_pattern' did not match any tests"
    exit 1
  fi

  if [[ status -ne 0 ]]; then
    failure_count=$((failure_count+1))
    echo
    echo "Flaky failure output ($failure_count):"
    echo "$output"
  fi
done

echo -e "\r\033[KFlakiness: $failure_count/$total_runs"
