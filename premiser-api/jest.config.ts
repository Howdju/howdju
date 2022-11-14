import type {Config} from 'jest'
import {merge} from 'lodash'

import baseConfig from '../jest.config.base'

const config: Config = {
  testPathIgnorePatterns: ["src/config/config\\.test\\.js"],
}

export default merge(baseConfig, config)
