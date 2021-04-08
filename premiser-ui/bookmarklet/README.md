# Local bookmarklet development

1. Start local server
   ```shell
   yarn run start:local
   ```
2. Build bookmarklet 
   ```shell
   yarn run build:bookmarklet:local
   ```
3. Copy load.js into a bookmarklet.  Edit it to use `http://localhost:3000/submit.js` as the URL

# Deploy bookmarklet

1. If updating load.js, copy into ToolsPage.js
2. If updating submit.js
  ```shell
  yarn run build:bookmarklet
  ```
3. Rename submit.min.js to submit.js
4. Upload to s3://cdn.howdju.com
5. Run invalidation of cdn.howdju.com/submit.js
