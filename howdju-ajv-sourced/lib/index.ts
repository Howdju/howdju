import {makeAjv, makeValidate} from 'howdju-common'
export {emptyValidationResult} from 'howdju-common'

export const ajv = makeAjv()
export const validate = makeValidate(ajv)
