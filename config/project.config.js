const path = require('path')


const basePath = path.resolve(__dirname, '..')

const config = {
	port: 3000,
	paths: {
		base: basePath,
		public: path.join(basePath, 'public')
	}
}

module.exports = config
