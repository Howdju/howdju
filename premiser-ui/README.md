# Howdju's Purpose
0. Howdju's purpose is to connect the world's information
0. Howdju's purpose is to provide people with the most efficient way to evaluate the truth of any statement
1. Howdju's purpose is to enable people to engage in informed dialogue about complex issues
2. Howdju's purpose is to enable people to evaluate the truth of complex issues with efficiency of time and 
   conservation of effort (their effort is recorded for them and others)
3. Howdju's purpose is to inform people of developments on issues relevant to them (interest, sociodemographic, geography)
4. Howdju's purpose is to connect people with organizations working to improve the issues of importance to them

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
      for a particular user based upon either that user's verification of justification on the statement or
      the verifications of users whose verification are highly correlated with the user give an indication
      of the predicted truth of the statement and by implication, the quote
    * And it would be possible to correct/tune an assessment of ‘quote is false’ by showing the user 
      disjustifications for the purportedly semantically equivalent statement. If the user disverifies 
      those disjustifications, then the system loses its confidence of the falsehood of the quote for 
      that user and similar users.
    * System can learn to find these required quote/statement pairs and show them to users for feedback

# Quotes and authors
* What the system is really trying to capture is events.  A quote isn't an event, a person saying something
  is an event, an organization publishing something is an event.  So video might evidence the former, and
  a website the latter. But what gets tricky is when an article quotes someone else.  So now the event
  is the publishing of the article, but it contains an imputation of another event.  It would be great to 
  capture this.

# Modification rules
* Can only delete bases (justifications/quotes) if other users haven't used them as bases
  * If super user deletes them, must cascade delete to justifications
  * Can't delete justifications if other users have voted or countered them
  * if delete justification, must delete counters
* Update/Delete validation rules
  _ If modification would conflict with another entity, then disallow
  - If user has permission to MODIFY_ALL_ENTITIES, then allow
  - If other users have interacted with the entity, then disallow
  - If a grace period of 24 hours or so has passed, then disallow
* For a justificaiton, must check counter justifications (recursively)

# Ontology
## Could justification compound atoms be positive justifications of justifications (the opposite of counter-justifications)
Maybe, but which would justify which?  In some cases, the justifications are equally necessary.  Although there is,
I think, a natural ordering to the atoms, which I will be capturing with the order attribute.  But rather than store
them in this way that (without some add'l index) would require a query per 
corroborating/equi/supporting/concurring/aligned-justification

From a UI perspective, would we show a justification with it's equi-justifications below and when a person votes
for them, they move up into the same level as the other atoms?

How to distinguish between things that are logically necessary vs. things that just make the case stronger?

It may be supportive of human users to assume the technique of logic and to just let users create these compounds in
a way that is natural (i.e. no fluid voting in out).  To support someone to modify or fix or trim the compound,
allow them to edit it, adding and subtracting atoms.  And then of course try to identify if they have added something 
making the compound equivalent to an existing compound.

# Conjunctive/Compound/Logical/Combined justifications
* Don't let user target statement with statements-based justification using same statements as another justification
* When you edit statement compounds and reorder or edit the text, you create a new statement compound
  * This is to prevent you tweaking a statement to work better in one context, while making it less appropriate for
    another context that you aren't looking at
  * What about editing the statement on its own page?  I guess editing statements must be limited to correcting
    mistakes, not to tweaking.
  * A compound statement with the same statements in the same order is the same compound statement

* rootStatementId doesn't work for compounds, because the same justification may be a compound on different statements
  * Actually we can squeak by for now because it is only one additional level of querying to pick up the atoms
  * And actually, we should not be duplicating justifications across statements or uses; if a user wants to create
    a justification using identical base as another, just create a new justification, and that can have the rootStatementID
    appropriate for its use (it should be identical to its based justification's rootStatementId)
  * What is the target type of a compound justification atom?  I guess it's the same as the based justification
  * wait a second, compounds don't need to combine justifications, just statements.
  * what if people want to change a compound only by reordering?
  * Should STATEMENT justifications just be one-off STATEMENT_COMPOUND justifications?
    * Yes.
    * Similar to URLs, add statements when selecting statement-based.
    * Add drag and drop to reorder
      * This would imply storing the order as a different justification, or some concept of variant.  A user wants
        to see the specific ordering that they created/verified
      * This suggests to me other types of variants, such as adding and removing statements, inserting them in 
        different orders, and replacing statements with semantically equivalent statements!
      * Also, how to display these variants in a managable way?  Would want to prioritize them by most likely to
        be acceptable.  And would like to highlight the difference between what the user is currently viewing and
        the alternative(s)
      * I'm imagining the current justification, then an infinite scrolling popup to the side that shows alternatives
        one after another, each one highlighted to show the difference between the active justification and it.
        The user can select one of these alternatives to make it the active one, and then new alternatives based upon
        that active justification are loaded into the alternatives popup.  This allows the user to navigate the graph
        of related justifications.
      * What if two very similar statement compound justifications are both at the top of recommended justifications
        for a statement; do we show both, or do we somehow capture that the most popular justification is this family
        of compound statements?  Then perhaps the user can view the family (similar to the alternative justification
        popup) and select the one they want to be active.
  * Should statement compounds be usable by different justifications?  Or are they like justifications in that they are
    purpose-built?  I.e., should the same statements used to justify one statement be identified with the same statements
    when used to justify another?
    * If a user reorders the statements, we wouldn't want that to reorder for other compounds.
    * It might be nice to capture the fact that a user used the same compound to justify another statement...but
      is this even really a common use case?  This seems more like they would want to make the two statements 
      semantically equivalent?
    * Yes, every argument has a context, which we may be able to model better at some point.  The contexts would
      change between compounds.
* UI for creating: highlight, select compound, it appears off to the side, continue to highlight, popup around
  highlight lets you save, lets you reorder and then submit with conclusion/target statement.
* But what if they don't want to just highlight quotes; what if they want intermediate statements?  So highlight,
  justification statement from quote, collecting justified statements, and finally justify other statement
* Actually, do we even allow users to create compounds of non-statement-based justifications?  I think not.