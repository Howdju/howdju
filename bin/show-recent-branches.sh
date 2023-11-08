#!/usr/bin/env bash

git for-each-ref --sort=-committerdate refs/heads/ | head
