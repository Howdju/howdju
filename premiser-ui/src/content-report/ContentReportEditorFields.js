import React, {Component} from 'react'
import PropTypes from 'prop-types'
import get from 'lodash/get'
import map from "lodash/map"

import {ContentReportTypes, schemaIds, schemaSettings} from "howdju-common"
import {validate} from "howdju-ajv-sourced"

import Checkbox from "../Checkbox"
import ErrorMessages from "../ErrorMessages"
import TextField from '../TextField'
import {
  combineIds,
  combineNames,
} from '../viewModels'

const  reportTypeDescriptions = {
  [ContentReportTypes.HARASSMENT]: "Harassment",
  [ContentReportTypes.THREATENING_VIOLENCE]: "Threatening violence",
  [ContentReportTypes.HATEFUL]: "Hateful content",
  [ContentReportTypes.OBSCENE]: "Obscene content (excessively sexual, violent, or gory)",
  [ContentReportTypes.SEXUALIZATION_OF_MINORS]: "Sexualization of minors",
  [ContentReportTypes.SHARING_PRIVATE_PERSONAL_INFORMATION]: "Sharing private personal information",
  [ContentReportTypes.PORNOGRAPHY]: "Pornography",
  [ContentReportTypes.ILLEGAL_ACTIVITY]: "Illegal activity",
  [ContentReportTypes.IMPERSONATION]: "Impersonation",
  [ContentReportTypes.COPYRIGHT_VIOLATION]: "Copyright violation",
  [ContentReportTypes.TRADEMARK_VIOLATION]: "Trademark violation",
  [ContentReportTypes.SPAM]: "Spam",
  [ContentReportTypes.OTHER]: "Other",
}

export default class ContentReportEditorFields extends Component {

  static propTypes = {
    contentReport: PropTypes.object,
    id: PropTypes.string.isRequired,
    /** If present, this string will be prepended to this editor's controls' names, with an intervening "." */
    name: PropTypes.string,
    disabled: PropTypes.bool,
    errors: PropTypes.object,
    onPropertyChange: PropTypes.func.isRequired,
  }

  render() {
    const {
      contentReport,
      id,
      name,
      disabled,
      errors: apiValidationErrors,
      onPropertyChange,
    } = this.props

    const description = get(contentReport, 'description')
    const checkedByType = get(contentReport, 'checkedByType')

    const modelErrors = get(apiValidationErrors, '_model')

    return (
      <>
        <ErrorMessages errors={modelErrors}/>
        {map(reportTypeDescriptions, (description, code)  => (
          <Checkbox
            id={combineIds(id, `${code}-checkbox`)}
            key={code}
            name={combineNames(name, `checkedByType[${code}]`)}
            label={description}
            value={code}
            checked={get(checkedByType, code)}
            disabled={disabled}
            onPropertyChange={onPropertyChange}
          />
        ))}
        <TextField
          id={combineIds(id, "description")}
          key="description"
          name={combineNames(name, "description")}
          label="Description"
          rows={2}
          maxRows={8}
          maxLength={schemaSettings.reportContentDescriptionMaxLength}
          value={description}
          disabled={disabled}
          onPropertyChange={onPropertyChange}
        />
      </>
    )
  }
}


