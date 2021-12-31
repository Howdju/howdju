#!/usr/bin/env bash

yarn run build:bookmarklet
rm dist/bookmarklet/submit.min.js
sed -i.sed "s/const schema = 'https';/const schema = 'http';/g" dist/bookmarklet/submit.js
sed -i.sed "s/const port = 443;/const port = 3000;/g" dist/bookmarklet/submit.js
ipaddress=$(ipconfig getifaddr en0)
sed -i.sed "s/const host = 'www.howdju.com';/const host = '${ipaddress}';/g" dist/bookmarklet/submit.js
rm dist/bookmarklet/submit.js.sed
