export class Quote {
  constructor({text, citation}) {
    this.text = text
    this.citation = citation
  }
}

export class Citation {
  constructor({title, sources}) {
    this.title = title
    this.sources = sources
  }
}

export class WebSource {
  constructor({url}) {
    this.url = url
  }
}

export const JustificationTargetType = {
  STATEMENT: 'STATEMENT',
  JUSTIFICATION: 'JUSTIFICATION'
}

export class JustificationTarget {
  constructor({ type, targetId }) {
    this.type = type;
    this.targetId = targetId;
  }
}