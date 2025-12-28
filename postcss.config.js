module.exports = {
  plugins: {
    'postcss-import': {},
    'postcss-mixins': {},
    'postcss-nested': {},
    'postcss-preset-env': {
      stage: 3,
      browsers: 'last 2 versions',
      features: {
        'nesting-rules': true
      }
    },
    'autoprefixer': {}
  }
}