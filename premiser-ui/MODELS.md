# Entities
Statement
  - text
Paraphrase
  - Paraphrasing Statement
  - SourceExcerpt (WritQuote, PicRegion, VidSegment, etc.)
    - excerpt, fragment, piece, portion, selection, pericope (an 'around-cutting'), lection (a version of a passage in 
      a particular copy or edition of a text; a variant reading.)
Justification
  - target (Statement, Justification (counter-justification))
  - basis (JustificationBasisCompound<JustificationBasisAtom>, intermediate: StatementCompound, WritQuote)
JustificationBasisAtom
  - type: Statement|Paraphrase
    - The creator of a statement-based atom can add a paraphrase later?  But then they can't remove it?
  - entity

## SourceExcerpts
PicRegion
  - URLs
  - Some sort of hash?
  - Region (per-URL?  Or ensure that each URL is the same image?)
VidSegment
  - URLs
  - Title
  - Creator
  - Quote/Caption
    - Speaker
  - Start/End (both for video and per-URL?)  For real-world video, what is really being captured is an event from an angle.
AudioSegment

## Source/SourceExcerpt Attributes:

### Writs (Probably best to combine these into one)
Document
  - Title
  - publisher (organization)
  - publication (collection included in)
  - edition (Issue/Volume)
  - Publication Date
  - Author(s)
  - Identifiers (ISBN, ISSN, DOI, PMID)
  - URLs
DocumentQuote
  - Document
  - quote
  - Speaker (if different from citation authors; the person being quoted; the actual source)
  - root citation? (the ultimate source of the quote, e.g. when someone quotes an article on their blog)
  
Book (Writ)
  - title
  - author(s)
  - editor(s)
  - publisher
  - publication?
  - publication date
  - edition
  - ISBN
Article (Writ)
  - title
  - author(s)
  - publisher
  - publication date(s)
  - editor(s)

### Pic
Pic
  - urls
  - caption(s) (vote up/down)
  - geolocation
  - creation date
  - creation device
  - exif data
  - some sort of thumbprint?
PicRegion
  - image
  - region (svg shape)
  - url(s) (Ideally if the contents of the region are the same, then they are the same 'image region', even if the pictures are cropped differently
    or if the regions are slightly different)
    - to start, probably easiest just to have a one-to-one region-to-URL
    - users will have to decide if the add'l region-URLs support the paraphrase
  
### Vid
Vid
  - title
  - urls
  - writer(s), director(s), producer(s), (people (Person/role)) (basically, whom can we hold responsible for the content?)
VidSegment
  - video
  - Speaker(s)
  - Source(s) (the person whose actually being quoted)
  - Transcript (the quote)
  - Start/End (must contain the transcript)
  - urls



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