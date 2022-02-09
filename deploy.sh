#!/bin/bash
yarn install || exit
yarn build || exit
rsync -rav ./build/ dhwarren@eaglepoint.dreamhost.com:warrenfalk.com/public/touchtype --delete
