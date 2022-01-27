#!/bin/bash
rsync -rav ./build/ dhwarren@eaglepoint.dreamhost.com:warrenfalk.com/public/touchtype --delete
