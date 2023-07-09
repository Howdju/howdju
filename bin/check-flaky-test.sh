#!/bin/bash

# Usage: check-flaky-test.sh <total_runs> <command>
#
# Example:
#
# $ ../bin/check-flaky-test.sh 100 MediaExcerptsService 'readOrCreateMediaExcerpt re-uses related entities.'

total_runs=$1
test_suite_pattern=$2
test_name_pattern=$3
run_count=0
failure_count=0

if [[ -n $test_name_pattern ]]; then
  echo Running $total_runs times: yarn run test "'$test_suite_pattern'" --testNamePattern="'$test_name_pattern'"
elif [[ -n $test_suite_pattern ]]; then
  echo Running $total_runs times: yarn run test "'$test_suite_pattern'"
else
  echo Running $total_runs times: yarn run test
fi

while [[ $run_count -lt $total_runs ]]; do
  run_count=$((run_count+1))
  echo -en "\r\033[KRun $run_count/$total_runs ($failure_count failures)"
  if [[ -n $test_name_pattern ]]; then
    output=$(yarn run test "$test_suite_pattern" --testNamePattern="$test_name_pattern" 2>&1)
  elif [[ -n $test_suite_pattern ]]; then
    output=$(yarn run test "$test_suite_pattern" 2>&1)
  else
    output=$(yarn run test 2>&1)
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
