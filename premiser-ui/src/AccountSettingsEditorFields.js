import React, {Component} from 'react'
import PropTypes from 'prop-types'
import get from 'lodash/get'

import {schemaSettings} from 'howdju-common'

import ErrorMessages from "./ErrorMessages"
import TextField from './TextField'
import {
  combineIds,
  combineNames,
} from './viewModels'


const paidContributionsDisclosureName = 'paidContributionsDisclosure'

export default class AccountSettingsEditorFields extends Component {

  static propTypes = {
    accountSettings: PropTypes.object,
    id: PropTypes.string.isRequired,
    /** If present, this string will be prepended to this editor's controls' names, with an intervening "." */
    name: PropTypes.string,
    disabled: PropTypes.bool,
    errors: PropTypes.object,
    onPropertyChange: PropTypes.func.isRequired,
  }

  render() {
    const {
      accountSettings,
      id,
      name,
      disabled,
      errors,
      onPropertyChange,
    } = this.props

    const modelErrors = get(errors, '_model')
    return (
      <div>
        <ErrorMessages errors={modelErrors}/>
        <TextField
          id={combineIds(id, paidContributionsDisclosureName)}
          key="quoteText"
          name={combineNames(name, paidContributionsDisclosureName)}
          label="Paid contributions disclosure"
          rows={2}
          maxRows={8}
          maxLength={schemaSettings.paidContributionsDisclosureTextMaxLength}
          value={accountSettings.paidContributionsDisclosure}
          onPropertyChange={onPropertyChange}
          disabled={disabled}
        />
        <em>For example: I receive compensation from Company A for my content relating to topics X, Y, and Z.</em>
      </div>
    )
  }
}
