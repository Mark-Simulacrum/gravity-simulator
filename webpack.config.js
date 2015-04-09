var webpack = require("webpack");

module.exports = {
    entry: [
        "./public/javascript/index.js"
    ],
    output: {
        publicPath: "public",
        path: "public/built",
        filename: "bundle.js"
    },
    plugins: [
        new webpack.optimize.DedupePlugin()
    ],
    module: {
        loaders: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loaders: [
                    "babel-loader?{optional: ['runtime', 'es7.classProperties']}"
                ]
            }
        ]
    },
    resolve: {
        modulesDirectories: ["node_modules", "public/javascript"]
    },
    devtool: "source-map"
};