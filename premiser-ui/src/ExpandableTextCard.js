import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import get from 'lodash/get'

import {
  mapActionCreatorGroupToDispatchToProps,
  ui,
} from './actions'

class ExpandableTextCard extends Component {

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
      CardComponent,
      // ignore
      widgetId,
      ui,
      // end ignore
      ...rest
    } = this.props
    return (
        <CardComponent {...rest}
                       isExpanded={isExpanded}
                       onExpand={this.onExpand}
                       onCollapse={this.onCollapse}
        />
    )
  }
}
ExpandableTextCard.propTypes = {
  CardComponent: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.func,
  ]).isRequired
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
}))(ExpandableTextCard)