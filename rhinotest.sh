#!/usr/bin/env bash

# This runs the test for only a single version. See "rhinoall.sh" to run them all

# To update this compatibility table for a new build of Rhino:
# 1) Build the JAR that you want to test
# 2) Set "rhinoJar" below to point to it
# 3) Set "rhinoVersion" below to the version number
# 4) Edit "rhinoversions.js" to add your new version to the list
# 5) Run this script!

rhinoJar=~/src/rhino/rhino-all/build/libs/rhino-all-1.7.16-SNAPSHOT.jar
rhinoVersion=1.7.14
supportVersion=14

curl https://raw.githubusercontent.com/kangax/compat-table/gh-pages/data-es6.js > data-es6.js
curl https://raw.githubusercontent.com/kangax/compat-table/gh-pages/data-es2016plus.js > data-es2016plus.js
curl https://raw.githubusercontent.com/kangax/compat-table/gh-pages/data-esnext.js > data-esnext.js

echo
echo 'extracting testers...'
node extract.js ./data-es6.js > ./testers-es6.json
node extract.js ./data-es2016plus.js > ./testers-es2016plus.json
node extract.js ./data-esnext.js > ./testers-esnext.json
node testers.js > testers.json

echo "supportVersion=${supportVersion}; load('rhinotest.js');" > tmptest.$$

echo 'Running test...'
java -jar ${rhinoJar} -version 0 -debug tmptest.$$ > rhino-results/${rhinoVersion}.json
java -jar ${rhinoJar} -version 200 -debug tmptest.$$ > rhino-results/${rhinoVersion}-es6.json

rm -f tmptest.$$

echo 'Building...'
node buildrhino.js
