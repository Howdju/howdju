#!/usr/bin/env bash

psql -h 127.0.0.1 -p 5433 -d howdju_pre_prod -U premiser_admin -f howdju.sql -v ON_ERROR_STOP=1
