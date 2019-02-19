#!/bin/bash
mkdir build
cp ./{index.js,package.json,yarn.lock} build/
cd build
yarn install --production
zip -r deploy.zip package.json node_modules/ index.js