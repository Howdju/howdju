trap "exit" INT TERM
trap "kill 0" EXIT

env=${1}

npm run db:tunnel &
sleep 5
npm run db:tunnel:shell:${env}
