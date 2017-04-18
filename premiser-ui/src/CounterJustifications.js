import React, {Component} from "react"
import Justification from './Justification'
import FlipMove from 'react-flip-move';
import config from './config';

class CounterJustifications extends Component {
  render() {
    const {counterJustifications, positivey} = this.props
    const {flipMoveDuration, flipMoveEasing} = config.ui.statementJustifications
    if (counterJustifications && counterJustifications.length > 0) {
      return (
          <div className="counterJustifications">
            <FlipMove duration={flipMoveDuration} easing={flipMoveEasing}>
              {counterJustifications.map(j =>

                <div className="row" key={j.id}>
                  <div className="col-xs-12">
                    <Justification key={j.id} withCounterJustifications justification={j} positivey={positivey} />
                  </div>
                </div>
              )}
            </FlipMove>
          </div>
      )
    }
    return null
  }
}

export default CounterJustifications