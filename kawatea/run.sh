#!/usr/bin/env bash

# Usage: ./run.sh ../problems/1.json rot-90

prob_ids=(1 2 3 5 6 7 8 9 10 45 48 50 56 57 58 60 61 62 64 66 68 69 71 74 75 76 78)
for id in $prob_ids; do
  for prog in `ls *.out`; do
    echo $id
    echo "./${prog} /dev/null ../hints/$2/${id}.json < ../problems/$1.json > kawatea-$prog-$2/${id}.json 2> kawatea-$prog-$2/${id}.log &"
  done
done