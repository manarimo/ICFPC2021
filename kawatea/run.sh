#!/usr/bin/env bash

# Usage: ./run.sh ../problems/1.json

for prog in `ls *.out`; do
  id=$(basename $1 | sed -e s/.json//)
  echo $id
  ./${prog} < $1 > ${id}_$prog.json 2> ${id}_$prog.log &
done