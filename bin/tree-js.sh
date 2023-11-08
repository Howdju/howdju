#!/usr/bin/env bash

tree -P '*.js' -I '**node_modules**' -I '**dist**' -I '**build**' -I '**coverage**' --prune | less
