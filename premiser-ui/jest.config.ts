import type {Config} from 'jest'
import {merge} from 'lodash'

import baseConfig from '../jest.config.base'

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['../jest/setup-after-env-testing-library-jest-dom.ts'],
}

export default merge(baseConfig, config)
