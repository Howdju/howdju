# Ontology of Editors
* ThingEntityCard
  * Displays ThingEntityViewer in a Card
* ThingEntityViewer
  * Displays an EditableThing with controls for editing
* EditableThing
  * Toggles between ThingEditor and ThingViewer
* ThingEditor
  * Extracts thing from editor state for ThingEditorFields
  * Extracts errors for ThingEditorFields
  * Submits Thing to API
  * Uses ThingEditorFields
* ThingEditorFields
  * Contains fields for editing
  * Enables sharing fields between the editors and forms that create entities
* ThingViewer
  * Display of Thing
  * ThingViewer: can contain OtherThingEditors if not a leaf component.
