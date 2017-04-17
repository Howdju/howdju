import React, {Component} from "react"
import Justification from './Justification'

class CounterJustifications extends Component {
  render() {
    const {counterJustifications} = this.props
    if (counterJustifications && counterJustifications.length > 0) {
      return (
          <div className="counterJustifications">
            {counterJustifications.map(j => <Justification key={j.id} withCounterJustifications justification={j} />)}
          </div>
      )
    }
    return null
  }
}

export default CounterJustifications