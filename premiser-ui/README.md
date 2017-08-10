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
Sunlight is the best disinfectent - Justice Louis D. Brandeis
Howdju: fighting disinformation, enabling democracy


* Add visible score to person making comment, telling them it is not so good to not include citations of their comment.
  * And fold comments without strong score
* wikipedia, politifact, 
 * https://blog.okfn.org/2016/02/01/google-funds-frictionless-data-initiative-at-open-knowledge/
* Private subscription, bounties, news subscription referral/bundling


* Example where we would want to allow helper conjunctions, but to zone in on the statements:
  "The tea party shouldn't be labeled racist because some members are racist"
  * Except that [Most Beatles fans would condemn a rapist]
    whereas [Few Tea Partiers have condemned racism]
  * Same justification idea as (equivalent justifications? Tag with logical fallacy?):
    * Muslim leaders decry extremism, whereas alt-right leaders tolerate or even instigate racism
    * on statement 1070 (http://localhost:3000/s/1070/racist-members-of-the-alt-right-are-just-like-extremist-adherants-to-islam-you-cant-denounce-the-entire-group-because-of-actions-of-the-few)
  * coordinating conjunctions: and, but, for, nor, or, so, and yet
  * subordinating conjunctions: after, although, as, as if, because, before, even if, even though, if, if only, 
    rather than, since, that, though, unless, until, when, where, whereas, wherever, whether, which, and while
* Home page
  * Featured perspectives
    * height of the capitol building limit DC
    * Hillary's emails
  * About