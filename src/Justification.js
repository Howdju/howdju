export default class Justification {
  constructor({id, type, basis, polarity, score}={}) {
    this.id = id;
    this.type = type;
    this.basis = basis;
    this.polarity = polarity;
    this.score = score;
  }
}