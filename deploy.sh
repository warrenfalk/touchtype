#!/bin/bash
set -eu
set -o pipefail

echo "Restoring..."
yarn install
echo "Building..."
yarn build
echo "Deploying..."
rsync -rav ./build/ dhwarren@eaglepoint.dreamhost.com:warrenfalk.com/public/touchtype --delete
