/*global require: false, module: false, __dirname: false */
'use strict';
var webpack = require('webpack');
var path = require('path');

// Input files appear in ./addons/xena.
// Build to ./app/addons/scripts/xena/js.
// Include in icgc build with script tag in app/index.html.
// In Gruntfile, watch the build target.
// Server should run webpack with 'watch' option.

module.exports = {
	entry: __dirname + "/addons/xena",
	output: {
		path: __dirname + "/app/addons/scripts/xena/js",
		publicPath: "/addons/scripts/xena/js/",
		library: "UCSCXena",
		filename: "[name].js"
	},
	module: {
		loaders: [
			{ test: /pdfkit|png-js/, loader: "transform?brfs" },
			{ test: /rx-dom/, loader: "imports?define=>false" },
			{
				test: /\.js$/,
				include: [
					path.join(__dirname, 'js'),
					path.join(__dirname, 'test'),
					path.join(__dirname, 'doc')
				],
				loaders: ['babel-loader'],
				type: 'js'},
			{ test: /\.css$/, loader: "style!css" },
			{ test: /\.json$/, loader: "json" },
			{ test: /\.(jpe?g|png|gif|svg|eot|woff2?|ttf)$/i, loaders: ['url?limit=10000'] }
		]
	},
	plugins: [
		new webpack.OldWatchingPlugin()
	],
	resolve: {
		alias: {
			rx$: 'rx/dist/rx',
			'rx.binding$': 'rx/dist/rx.binding',
			'rx.async$': 'rx/dist/rx.async',
			'rx.experimental$': 'rx/dist/rx.experimental',
			'rx.coincidence$': 'rx/dist/rx.coincidence'
		},
		extensions: ['', '.js', '.json', '.coffee']
	}
};
