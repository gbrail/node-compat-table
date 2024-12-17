#!/usr/bin/env bash

. $NVM_DIR/nvm.sh

version=$1
nvm install $version
node test.js
node --es_staging test.js
node --harmony test.js
nvm deactivate
nvm uninstall $version  # Don't fill the disk with node installs.
