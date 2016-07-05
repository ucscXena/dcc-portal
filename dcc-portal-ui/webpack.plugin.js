var config = require('./webpack.config');
var webpack = require('webpack');
process.env.NODE_ENV = '"production"';         // * Not sure why needed both here & in a plugin.
//config.output.publicPath = 'chrome-extension://ocinpcchfchlffoddfbgdbdlchlejeei/';
//config.output.publicPath = 'chrome-extension://jncbbbnnngolobnbhblanncenlmkehip/';
config.output.publicPath = 'chrome-extension://mioappmfabckgimggmdglcdcaalcodfe/';
config.plugins.push(
		new webpack.DefinePlugin({
		  "process.env.NODE_ENV": '"production"'
		}));
module.exports = config;
