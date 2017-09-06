
# Entities
Statement
  - text
Paraphrase
  - Statement
  - SourceReference (CitationQuote (CitationReference), ImageRegion, VideoSegment, etc.)
Justification
  - target (Statement)
  - basis (ParaphraseCompound)

## SourceReferences
CitationReference
  - Quote
    - Speaker (if different from citation authors)
  - Citation
  - RootCitation (the ultimate source of the quote)
  - How to deal with republication?  Like someone quotes an article on their blog?
ImageRegion
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

## Sources
Citation
  - Title
  - Publication
    - Publication Name
    - Publisher
  - Publication Issue/Volume/Edition
  - Publication Date
  - Author(s)
  - Identifiers (ISBN, ISSN, DOI, PMID)
  - URLs
Image
Video
Book
Article
  
Compound
  - Atoms (Statement, Paraphrase)
  
Justification
  - Target (Statement)
  - Basis (ParaphraseCompound, StatementCompound)
    - But a Paraphrase is just the statement with a source.
      - But the creator of the justification is responsible for finding the source