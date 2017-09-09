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
VideoSegment
  - URLs
  - Title
  - Creator
  - Quote/Caption
    - Speaker
  - Start/End

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
