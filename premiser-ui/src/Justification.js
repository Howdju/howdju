import classNames from "classnames"
import React, {Component} from "react"
import {connect} from "react-redux"
import Divider from "react-md/lib/Dividers"
import Card from "react-md/lib/Cards/Card"
import CardActions from "react-md/lib/Cards/CardActions"
import Button from "react-md/lib/Buttons"
import FontIcon from "react-md/lib/FontIcons"
import MenuButton from "react-md/lib/Menus/MenuButton"
import ListItem from "react-md/lib/Lists/ListItem"
import Positions from "react-md/lib/Menus/Positions"
import {verifyJustification, disverifyJustification, unVerifyJustification, unDisverifyJustification} from './actions'
import {
  JustificationPolarity, JustificationBasisType, isVerified,
  isDisverified, isPositive, isNegative
} from './models'
import {extractDomain} from './util'
import CounterJustifications from './CounterJustifications'

class Justification extends Component {
  constructor() {
    super()
    this.state = {isOver: false}
    this.onCardMouseOver = this.onCardMouseOver.bind(this)
    this.onCardMouseLeave = this.onCardMouseLeave.bind(this)
    this.onVerifyButtonClick = this.onVerifyButtonClick.bind(this)
    this.onDisverifyButtonClick = this.onDisverifyButtonClick.bind(this)
  }

  onCardMouseOver() {
    this.setState({isOver: true})
  }

  onCardMouseLeave() {
    this.setState({isOver: false})
  }

  onVerifyButtonClick() {
    const {justification} = this.props
    if (isVerified(justification)) {
      this.props.unVerifyJustification(justification)
    } else {
      this.props.verifyJustification(justification)
    }
  }

  onDisverifyButtonClick() {
    const {justification} = this.props
    if (isDisverified(justification)) {
      this.props.unDisverifyJustification(justification)
    } else {
      this.props.disverifyJustification(justification)
    }
  }

  render() {
    const {justification, withCounterJustifications, positivey} = this.props
    const _isVerified = isVerified(justification)
    const _isDisverified = isDisverified(justification)
    const {isOver} = this.state
    const justificationClasses = classNames({
      justification: true,
      positivey: positivey,
      negativey: !positivey,
    })
    const justificationTextClasses = classNames({
      justificationText: true,
      quote: justification.basis.type === JustificationBasisType.REFERENCE,
    })
    const text = justification.basis.type === JustificationBasisType.STATEMENT ? justification.basis.entity.text : justification.basis.entity.quote
    const menu = (
        <MenuButton
            icon
            id={`justification-${justification.id}-context-menu`}
            menuClassName="justificationContextMenu"
            buttonChildren={isOver ? 'more_vert' : 'empty'}
            position={Positions.TOP_RIGHT}
        >
          <ListItem primaryText="Counter" leftIcon={<FontIcon>reply</FontIcon>} />
          <ListItem primaryText="Use" leftIcon={<FontIcon>call_made</FontIcon>} />
          <Divider />
          <ListItem primaryText="Edit" leftIcon={<FontIcon>create</FontIcon>} />
          <ListItem primaryText="Delete" leftIcon={<FontIcon>delete</FontIcon>} />
        </MenuButton>
    )
    return (
        <div id={`justification-${justification.id}`} className={justificationClasses}>
          <Card className="justificationCard"
                onMouseOver={this.onCardMouseOver}
                onMouseLeave={this.onCardMouseLeave}
          >

            <div className="md-grid">
              <div className="md-cell md-cell--12">

                <div>
                  {menu}
                  <div className={justificationTextClasses}>
                    <span>{text}</span>
                  </div>
                  {justification.basis.type === JustificationBasisType.REFERENCE &&
                    <ul>
                      {justification.basis.entity.urls.map(u => <a key={`url-${u.id}`} href={u.url}>{extractDomain(u.url)}</a>)}
                    </ul>
                  }
                </div>

              </div>
            </div>

            <CardActions className="actions">
              <Button icon
                      className={classNames({
                        verified: _isVerified,
                        inactive: !isOver,
                        hiding: _isDisverified && !isOver,
                        otherSelected: _isDisverified,
                      })}
                      title="Verify this justification"
                      onClick={this.onVerifyButtonClick}
              >thumb_up</Button>
              <Button icon
                      className={classNames({
                        disverified: _isDisverified,
                        inactive: !isOver,
                        hiding: _isVerified && !isOver,
                        otherSelected: _isVerified,
                      })}
                      title="Dis-verify this justification"
                      onClick={this.onDisverifyButtonClick}
              >thumb_down</Button>
              <Button icon
                      className={classNames({
                        hiding: !isOver,
                        otherSelected: _isVerified || _isDisverified,
                      })}
                      title="Counter this justification"
              >reply</Button>
            </CardActions>
          </Card>
          {withCounterJustifications &&
            <CounterJustifications counterJustifications={justification.counterJustifications} positivey={!positivey} />}
        </div>
    )
  }
}

export default connect(null, {
  verifyJustification,
  unVerifyJustification,
  disverifyJustification,
  unDisverifyJustification,
})(Justification)