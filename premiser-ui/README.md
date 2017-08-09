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
  
  
The further a society drifts from truth, the more it will hate those that speak it - George Orwell



* Add visible score to person making comment, telling them it is not so good to not include citations of their comment.
  * And fold comments without strong score
* wikipedia, politifact, 
 * https://blog.okfn.org/2016/02/01/google-funds-frictionless-data-initiative-at-open-knowledge/
* Private subscription, bounties, news subscription referral/bundling