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
  
* ThingViewer: can contain OtherThingEditors if not a leaf component.