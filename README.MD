

# Webpack Terminal Plugin
[![Star](https://img.shields.io/github/stars/zenotsai/webpack-terminal-plugin)](	https://img.shields.io/github/stars/zenotsai/webpack-terminal-plugin)
[![Issues](https://img.shields.io/github/issues/zenotsai/webpack-terminal-plugin/issues)](https://github.com/zenotsai/webpack-terminal-plugin/issues)

![](https://raw.githubusercontent.com/zenotsai/image-hosting/master/frontend/截屏2022-04-24-下午4.png)


Based on [vite-plugin-terminal](https://github.com/patak-dev/vite-plugin-terminal) modification


# Install
```npm i -D webpack-plugin-terminal```


# Usage

```js
const { WebpackTerminalPlugin } = require("webpack-plugin-terminal");
new WebpackTerminalPlugin({
  console: "console", //  console (default) | terminal  
})
```

The default will hijack the console

```console.table(['webpack', 'plugin', 'terminal']); ```


If the devServer is standalone (e.g. create-react-app) you need to configure middlewares

```js
const {  terminalMiddleware } = require("webpack-plugin-terminal");
  devServer: {
    port: 5000,
    compress: true,
    open: true,
    hot: true,
    setupMiddlewares: (middlewares) => {
      middlewares.unshift(terminalMiddleware());
      return middlewares
    },
    client: { progress: true },
  },
```

## Options


### `externalScript`

Type: `boolean`<br>
Default: `false`<br>

Generate the js file, create the script and specify the src

### `console`

Type: `'terminal' | undefined`<br>
Default: `undefined`<br>

Set to `'terminal'` to make `globalThis.console` equal to the `terminal` object in your app.


### `output`

Type: `'terminal' | 'console' | ['terminal', 'console']`<br>
Default: `terminal`<br>

Define where the output for the logs.

## API

Supported methods:
- `terminal.log(obj1 [, obj2, ..., objN])`
- `terminal.info(obj1 [, obj2, ..., objN])`
- `terminal.warn(obj1 [, obj2, ..., objN])`
- `terminal.error(obj1 [, obj2, ..., objN])`
- `terminal.assert(assertion, obj1 [, obj2, ..., objN])`
- `terminal.group()`
- `terminal.groupCollapsed()`
- `terminal.groupEnd()`
- `terminal.table(obj)`
- `terminal.time(id)`
- `terminal.timeLog(id, obj1 [, obj2, ..., objN])`
- `terminal.timeEnd(id)`
- `terminal.clear()`
- `terminal.count(label)`
- `terminal.countReset(label)`
- `terminal.dir(obj)` 
- `terminal.dirxml(obj)` 

These methods will work but use the console

- `terminal.trace(...args: any[])`
- `terminal.profile(...args: any[])`
- `terminal.profileEnd(...args: any[])`

