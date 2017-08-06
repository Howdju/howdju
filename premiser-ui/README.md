# Bookmarklet
1. Build bookmarklet 
   ```shell
   yarn run bookmarklet
   ```
2. Copy contents of `dist/submit.min.js`
3. Enter into Chrome dev console
   ```js
   window.encodeURIComponent(<bookmarklet>)
   ```
4. Copy result (without the quotes Chrome will put around the output string) into ToolsPage.

# Ontology of Editors
* EditableThing
  * Toggles between ThingEditor and ThingViewer
* ThingEditor
  * Extracts thing from editor state for ThingEditorFields
  * Extracts errors for ThingEditorFields
  * Submits Thing to API
  * Uses ThingEditorFields
* ThingEditorFields
  * Contains fields for editing
* ThingViewer
  * Display of Thing