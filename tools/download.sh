#!/bin/sh

cd `dirname $0`

API_KEY=78145a42-91f5-4559-af81-3b0990463771

for i in `seq 1 59`
do
   echo "Downloading #$i"
   curl "https://poses.live/api/problems/$i" -H "Authorization: Bearer $API_KEY" > ../problems/$i.json
done
