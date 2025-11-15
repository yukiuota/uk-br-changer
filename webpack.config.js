module.exports = {
    ...require('@wordpress/scripts/config/webpack.config'),
    entry: {
        index: './src/index.tsx',
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
};