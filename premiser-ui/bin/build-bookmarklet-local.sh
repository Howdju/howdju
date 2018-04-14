#!/usr/bin/env bash

yarn run build:bookmarklet
rm dist/bookmarklet/submit.min.js
sed -i.sed "s/var schema = 'https';/var schema = 'http';/g" dist/bookmarklet/submit.js
sed -i.sed "s/var port = 443;/var port = 3000;/g" dist/bookmarklet/submit.js
sed -i.sed "s/var host = 'www.howdju.com';/var host = 'localhost';/g" dist/bookmarklet/submit.js
rm dist/bookmarklet/submit.js.sed
