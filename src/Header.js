import React, { Component, PropTypes } from 'react'
import { Link } from 'react-router-dom'

export default class Header extends Component {
  render() {
    return (
        <div id="header">
          <Link to="/">Howdju?</Link>
          <input type="text" />
        </div>
    )
  }
}