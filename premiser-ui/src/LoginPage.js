import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

import {login} from './actions'

import {callApi} from './api'

class LoginPage extends Component {

  constructor() {
    super()

    this.state = {
      email: '',
      password: '',
    };

    this.handleInputChange = this.handleInputChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleInputChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value
    const name = target.name
    this.setState({[name]: value})
  }

  handleSubmit(event) {
    event.preventDefault()
    this.props.login({
      email: this.state.email,
      password: this.state.password
    })
  }

  render () {
    return (
        <form  onSubmit={this.handleSubmit}>
          <label>
            Email
            <input type="text" name="email" value={this.state.email} onChange={this.handleInputChange}/>
          </label>
          <label>
            Password
            <input type="password" name="password" value={this.state.password} onChange={this.handleInputChange}/>
          </label>
          <input type="submit" value="Login"/>
        </form>
    )
  }
}

const mapStateToProps = (state) => ({})

export default connect(mapStateToProps, {
  login
})(LoginPage)