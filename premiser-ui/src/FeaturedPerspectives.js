import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import get from 'lodash/get'
import {perspectivesSchema} from "./schemas";
import {denormalize} from "normalizr";
import map from 'lodash/map'

import PerspectiveCard from './PerspectiveCard'
import {
  api,
  mapActionCreatorGroupToDispatchToProps,
} from './actions'

class FeaturedPerspectives extends Component {

  componentWillMount() {
    if (!this.props.perspectives) {
      this.props.api.fetchFeaturedPerspectives(this.props.widgetId)
    }
  }

  componentWillReceiveProps(nextProps) {
    const areUnequal = this.props.perspectives !== nextProps.perspectives
    const length = this.props.perspectives ? this.props.perspectives.length : 0
    const nextLength = nextProps.perspectives ? nextProps.perspectives.length : 0
    const didPerspectivesChange = areUnequal || length !== nextLength
    if (didPerspectivesChange && this.props.onPerspectivesLengthChange) {
      console.log('onPerspectivesLengthChange')
      this.props.onPerspectivesLengthChange()
    }
  }

  render () {
    const {
      perspectives,
    } = this.props
    return (
        <div>
          {perspectives && perspectives.length > 0 ?
              map(perspectives, p => {
                const id = `perspective-${p.id}`
                return <PerspectiveCard key={id} perspective={p} />
              }) :
              <div>No featured perspectives.</div>
          }
        </div>
    )
  }
}
FeaturedPerspectives.propTypes = {
  widgetId: PropTypes.string.isRequired,
  onPerspectivesLengthChange: PropTypes.func,
}
const mapStateToProps = (state, ownProps) => {
  const widgetState = get(state, ['widgets', ownProps.widgetId], {})
  const perspectives = denormalize(widgetState.featuredPerspectives, perspectivesSchema, state.entities)
  const {
    continuationToken,
  } = widgetState
  return {
    perspectives,
    continuationToken,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  api,
}))(FeaturedPerspectives)