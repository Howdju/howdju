import React, {Component} from "react"
import Justification from './Justification'

class CounterJustifications extends Component {
  render() {
    const {counterJustifications, positivey} = this.props
    if (counterJustifications && counterJustifications.length > 0) {
      return (
          <div className="counterJustifications">
            {counterJustifications.map(j =>
                <Justification key={j.id} withCounterJustifications justification={j} positivey={positivey} />
            )}
          </div>
      )
    }
    return null
  }
}

export default CounterJustifications