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
 
# The money-maker
* How does the system discredit the semantic content of a quote?
  * because this is the most salient universal use case: premisering any web page to see which things in it
    are untrue.
  * If a quote never successfully justifies a statement, that's a clue.
  * Counter-justifications counter either the truth of the citation OR the implication of the truth of the 
    statement; but how to differentiate?
  * Could try using ML/NLP to find semantically equivalent statements.
  * Could allow users to enter candidate semantically equivalent statements for the quote
  * Sometimes a quote justifies a very near semantically equivalent statement...but how to tell this
    from another targeted statement that is not really semantically equivalent
    * If the statement reliably justifies a third statement but the quote does not, then they could
      be called not semantically equivalent.
    * Alternatively, if their justification reliability is highly correlated, then they might be
      said to be semantically equivalent?
    * The system could help determine their correlation by choosing to show one higher than the other in 
      justifications list (otherwise one might be slightly preferable and then winner-take-all the other, 
      losing data on correlation)
    * And if they are semantically equivalent, then the system's best idea of the truth of the statement
      for a particular based upon either that user's verification of justification on the statement or
      the verifications of users whose verification are highly correlated with the user give an indication
      of the predicted truth of the statement and by implication, the quote
    * And it would be possible to correct/tune an assessment of ‘quote is false’ by showing the user 
      disjustifications for the purportedly semantically equivalent statement. If the user disverifies 
      those disjustifications, then the system loses its confidence of the falsehood of the quote for 
      that user and similar users.