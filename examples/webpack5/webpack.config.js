const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { WebpackTerminalPlugin } = require("webpack-plugin-terminal");
module.exports = {
  mode: "development",
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "./dist"),
    filename: "index_bundle.js",
  },
  devServer: {
    port: 5000,
    compress: true,
    open: true,
    hot: true,
 
    // setupMiddlewares: (middlewares) => {
    //   middlewares.unshift(terminalMiddleware());
    //   return middlewares
    // },
    client: { progress: true },
  },
  plugins: [
    new WebpackTerminalPlugin({
      externalScript: true,
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "./public/index.html"),
    })
  ],
};