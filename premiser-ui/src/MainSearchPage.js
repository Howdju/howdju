import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

class MainSearchPage extends Component {

  render () {
    const {
      isFetching,
      statements,
    } = this.props
    return (
      <div className="md-grid">
        <div className="md-cell md-cell--12">
          <ul>
            {isFetching ?
              <div>Loading...</div> :
              !statements.length ?
                <div>No results.</div> :
                statements.map(s => <li key={s.id}><Link to={'/s/' + s.id + '/' + s.slug}>{s.text}</Link></li>)
            }
          </ul>
        </div>
      </div>
    )
  }
}

const mapStateToProps = (state) => {
  const {
    ui: {
      mainSearchPage: {
        isFetching,
        statements,
      }
    }
  } = state
  return {
    isFetching,
    statements,
  }
}

export default connect(mapStateToProps)(MainSearchPage)