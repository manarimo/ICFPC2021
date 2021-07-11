#!/usr/bin/env bash

set -v

function compile() {
    tl=$1
    temp=$2
    ../cpp-lib/compile.sh -O3 simulated_annealing.cpp
}

compile