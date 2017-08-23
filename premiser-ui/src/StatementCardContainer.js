import React, {Component} from 'react'
import {connect} from 'react-redux'
import get from 'lodash/get'

import {
  mapActionCreatorGroupToDispatchToProps,
  ui,
} from './actions'
import StatementCard from './StatementCard'

class StatementCardContainer extends Component {

  onExpand = () => {
    const {
      widgetId
    } = this.props
    this.props.ui.expand(widgetId)
  }

  onCollapse = () => {
    const {
      widgetId
    } = this.props
    this.props.ui.collapse(widgetId)
  }

  render() {
    const {
      isExpanded,
      // ignore
      widgetId,
      ui,
      // end ignore
      ...rest
    } = this.props
    return (
        <StatementCard {...rest}
                       isExpanded={isExpanded}
                       onExpand={this.onExpand}
                       onCollapse={this.onCollapse}
        />
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const {
    widgetId
  } = ownProps
  const widgetState = get(state, ['widgets', 'expandCollapse', widgetId], {})
  const {
    isExpanded
  } = widgetState
  return {
    isExpanded
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  ui,
}))(StatementCardContainer)