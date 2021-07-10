#!/usr/bin/env bash

set -v

function compile() {
    tl=$1
    temp=$2
    g++ -O3 simulated_annealing.cpp -o time_${tl}_temp_${temp}.out -D TIME_LIMIT=$tl -D START_TEMP=$temp
}

compile 600 100
compile 600 1000
compile 600 10000