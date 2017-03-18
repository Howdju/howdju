import React, { Component, PropTypes } from 'react'
import { Link } from 'react-router-dom'

export default class Home extends Component {
  render () {
    return (
        <Link to="/s/1/blah-blah-blah">Statement 1</Link>
    )
  }
}
