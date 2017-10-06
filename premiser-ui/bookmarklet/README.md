# Local bookmarklet development
1. Start local server
   ```shell
   yarn run local
   ```
2. Build bookmarklet 
   ```shell
   yarn run bookmarklet
   ```
3. Copy contents from `dist/submit.js` (where the script builds it because we don't create the intermediate
   folder) to `dist/bookmarklet/submit.js` where the dev server will statically serve it (because we don't
   want to statically serve the contents of the `dist` folder or it might interfere with HMR.)
4. Copy load.js into a bookmarklet but use `http://localhost:3000/submit.js` as the URL

# Deploy bookmarklet
1. If updating load.js, copy into ToolsPage.js
2. If updating submit.js
  ```shell
  yarn run bookmarklet
  ```
3. Rename submit.min.js to submit.js
4. Upload to s3://cdn.howdju.com
5. Run invalidation