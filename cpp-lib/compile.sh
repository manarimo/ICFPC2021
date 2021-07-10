#!/usr/bin/env bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
g++ -O3 -std=c++17 -I${SCRIPT_DIR} "$@"