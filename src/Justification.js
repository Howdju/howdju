export const JustificationType = {
  STATEMENT: 'STATEMENT',
  QUOTE: 'QUOTE',
}

export default class Justification {
  constructor({id, target, type, basis, polarity, score}={}) {
    this.id = id;
    this.target = target;
    this.type = type;
    this.basis = basis;
    this.polarity = polarity;
    this.score = score;
  }
}