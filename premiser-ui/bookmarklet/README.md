# Local bookmarklet development

1. Edit the start command (`start:ui:local`) to use `HOST_ADDRESS=` to your machine's local address.

   This is required because I can't figure out how to add a CORS header to the public resources.

2. Start local server

   ```shell
   yarn run start:ui:local
   ```

3. Build bookmarklet

   ```shell
   yarn run build:bookmarklet:local
   ```

4. Copy load.js into a bookmarklet.

# Deploy bookmarklet

1. If updating load.js, copy into ToolsPage.js
2. If updating submit.js

```shell
yarn run build:bookmarklet
```

3. Rename submit.min.js to submit.js
4. Upload to s3://cdn.howdju.com
5. Run invalidation of cdn.howdju.com/submit.js
