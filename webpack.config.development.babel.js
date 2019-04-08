const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    devtool: 'source-map',
    entry: './examples/main.js',
    module: {
        rules: [
            {
                exclude: /node_modules/,
                loader: 'babel-loader',
                test: /\.js$/
            }
        ]
    },
    output: {
        filename: './dist/bundle.js',
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: 'react-pan-and-zoom-hoc examples'
        })
    ],
    resolve: {
        extensions: ['.js']
    }
};
