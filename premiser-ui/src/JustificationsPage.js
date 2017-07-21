import React, {Component} from "react";
import {connect} from "react-redux";
import map from 'lodash/map'
import get from 'lodash/get'
import queryString from 'query-string'

import {
  api,
  mapActionCreatorGroupToDispatchToProps,
} from "./actions";
import JustificationCard from "./JustificationCard";
import {denormalize} from "normalizr";
import {justificationsSchema} from "./schemas";

class JustificationsPage extends Component {
  componentWillMount() {
    const {
      citationId,
      statementId,
    } = queryString.parse(window.location.search)
    this.props.api.fetchJustifications({citationId, statementId})
  }
  render() {
    const {
      justifications
    } = this.props
    return (
        <div>
          <h1>Justifications</h1>

          <div className="md-grid">
            {justifications && justifications.length > 0 ?
                map(justifications, j => (
                  <JustificationCard key={`justification-card-${j.id}`} justification={j}/>
              )) :
              <div>No justifications</div>
            }
          </div>
        </div>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const pageState = get(state, ['ui', 'justificationsPage'], {})
  const justifications = denormalize(pageState.justifications, justificationsSchema, state.entities)
  return {
    justifications
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  api,
}))(JustificationsPage)
