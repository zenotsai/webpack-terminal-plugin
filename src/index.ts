import { insertStringAfter } from './utils';
import WebpackSource from 'webpack-sources';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import type { Compiler } from 'webpack'
import { parseURL } from 'ufo'
import readline from 'readline'
import table from './table'
import { dispatchLog } from './logQueue'
import { lightGray, lightMagenta, lightRed, lightYellow } from 'kolorist'
import createLogger from './logger';

const methods = ['assert', 'error', 'info', 'log', 'table', 'warn', 'clear'] as const

type Method = typeof methods[number]

type OutputType = 'console' | 'terminal';

type Console = 'console' | 'terminal'

export type LogsOutput = OutputType | OutputType[]

interface IOptions {
  externalScript: boolean;
  console?: Console;
  output?: LogsOutput
}
const colors = {
  log: lightMagenta,
  info: lightGray,
  warn: lightYellow,
  error: lightRed,
  assert: lightRed,
}


interface Terminal {
  assert: (assertion: boolean, obj: any) => void
  error: (...obj: any[]) => void
  info: (...obj: any[]) => void
  log: (...obj: any[]) => void
  table: (obj: any) => void
  warn: (...obj: any[]) => void
  group: () => void
  groupCollapsed: () => void
  groupEnd: () => void
  time: (id: string) => void
  timeLog: (id: string) => void
  timeEnd: (id: string) => void
  clear: () => void
  count: (label?: string) => void
  countReset: (label?: string) => void
  dir: (object: any) => void
  dirxml: (object: any) => void
  trace: (...args: any[]) => void
  profile: (...args: any[]) => void
  profileEnd: (...args: any[]) => void
}


const groupText = (text: string, groupLevel: number) => {
  if (groupLevel !== 0)
    return `${'  '.repeat(groupLevel)}${text.split('\n').join(`\n${'  '.repeat(groupLevel)}`)}`
  else
    return text
}
const logger = createLogger();
const WebpackPluginTerminalPluginName = 'WebpackPluginTerminalPlugin'


// function getPublicPath (compilation: Compilation) {
//   const publicPath = compilation.options.output.publicPath;
//   const isPublicPathDefined = publicPath !== 'auto';
//   if (isPublicPathDefined) {
//     if (!publicPath) {
//       return `./`
//     }
//     return publicPath;
//   }
//   return './'

// }
function createTerminal() {
  const console = globalThis.console;
  let count = 0
  let groupLevel = 0
  const timers = new Map<string, number>()
  const counters = new Map<string, number>()

  function getTimer(id: string) {
    return timers.has(id)
      ? `${id}: ${performance.now() - timers.get(id)!} ms`
      : `Timer ${id} doesn't exist`
  }

  function prettyPrint(obj: any) {
    if (obj instanceof Error) {
      return obj.toString()
    }
    return JSON.stringify(obj, null, 2)
  }
  function stringify(obj: any) {
    return typeof obj === 'object' ? `${JSON.stringify(obj)}` : obj.toString()
  }


  function stringifyObjs(objs) {
    const obj = objs.length > 1 ? objs.map(stringify).join(' ') : objs[0]
    return typeof obj === 'object' ? `${prettyPrint(obj)}` : obj.toString()
  }

  function send(type: string, message?: string) {
    const encodedMessage = message ? `&m=${encodeURI(message)}` : ''
    fetch(`/__terminal/${type}?t=${Date.now()}&c=${count++}&g=${groupLevel}${encodedMessage}`, { mode: 'no-cors' })
  }
  const terminal = {
    log(...objs: any[]) { send('log', stringifyObjs(objs)) },
    info(...objs: any[]) { send('info', stringifyObjs(objs)) },
    warn(...objs: any[]) { send('warn', stringifyObjs(objs)) },
    error(...objs: any[]) { send('error', stringifyObjs(objs)) },
    assert(assertion: boolean, ...objs: any[]) {
      if (!assertion)
        send('assert', `Assertion failed: ${stringifyObjs(objs)}`)
    },
    table(obj: any) { send('table', prettyPrint(obj)) },
    group() {
      groupLevel++
    },
    groupCollapsed() {
      groupLevel++
    },
    groupEnd() {
      groupLevel && --groupLevel
    },
    time(id: string) {
      timers.set(id, performance.now())
    },
    timeLog(id: string, ...objs: any[]) {
      send('log', `${getTimer(id)} ${stringifyObjs(objs)}`)
    },
    timeEnd(id: string) {
      send('log', getTimer(id))
      timers.delete(id)
    },
    count(label?: string) {
      const l = label || 'default'
      const n = (counters.get(l) || 0) + 1
      counters.set(l, n)
      send('log', `${l}: ${n}`)
    },
    countReset(label?: string) {
      const l = label || 'default'
      counters.set(l, 0)
      send('log', `${l}: 0`)
    },
    clear() {
      send('clear')
    },
    dir(obj: any) {
      send('log', prettyPrint(obj))
    },
    dirxml(obj: any) {
      send('log', prettyPrint(obj))
    },
    trace(...args: any[]) { console.trace(...args) },
    profile(...args: any[]) { console.profile(...args) },
    profileEnd(...args: any[]) { console.profileEnd(...args) },
  }
  function defineOutput(terminal: Terminal) {
    // @ts-ignore
    if (!outputToConsole)
      return terminal
    // @ts-ignore
    if (!outputToTerminal)
      return console
    // Log to both the terminal and the console
    const unsupportedMethods = ['trace', 'profile', 'profileEnd']
    const multicast = {}
    Object.keys(terminal).forEach((method) => {
      // @ts-ignore
      multicast[method] = unsupportedMethods.includes(method)
        // @ts-ignore
        ? console[method]
        : (...args: any[]) => {
          // @ts-ignore
          console[method](...args)
          // @ts-ignore
          terminal[method](...args)
        }
    })
    return multicast as Terminal
  }

  return defineOutput(terminal)
}




export const terminalMiddleware = function () {
  function hasFilter(msg: string) {
    return (msg.includes('[webpack-dev-server]') || msg.includes('[HMR]'))
  }
  return {
    name: 'terminalMiddleware',
    path: '/__terminal',
    middleware: (req, res) => {
      try {
        const { pathname, search } = parseURL(req.url)
        const searchParams = new URLSearchParams(search.slice(1))
        let message = ''
        try {
          message = decodeURI(searchParams.get('m') ?? '').split('\n').join('\n  ')
        } catch (e) {
          message = searchParams.get('m') ?? ''.split('\n').join('\n  ')
        }
        if (hasFilter(message)) {
          res.end()
          return;
        }
        const time = parseInt(searchParams.get('t') ?? '0')
        const count = parseInt(searchParams.get('c') ?? '0')
        const groupLevel = parseInt(searchParams.get('g') ?? '0')
    
        if (pathname[0] === '/') {
          const method = pathname.slice(1) as Method
          if (methods.includes(method)) {
            let run
            switch (method) {
              case 'clear': {
                run = () => {
                  if (process.stdout.isTTY && !process.env.CI) {
                    const repeatCount = process.stdout.rows - 2
                    const blank = repeatCount > 0 ? '\n'.repeat(repeatCount) : ''
                    console.log(blank)
                    readline.cursorTo(process.stdout, 0, 0)
                    readline.clearScreenDown(process.stdout)
                  }
                }
                break
              }
              case 'table': {
                const obj = JSON.parse(message)
                const indent = 2 * (groupLevel + 1)
                run = () => logger.info(`» ${table(obj, indent, 2)}`)
                break
              }
              default: {
                const color = colors[method]
                const groupedMessage = groupText(message, groupLevel)
                run = () => logger.info(color(`» ${groupedMessage}`))
                break
              }
            }
            dispatchLog({ run, time, count })
          }
        }
        res.end()
      } catch (e) {
        console.log('异常。。。', req.url)
      }

    }
  }

}


function generateInjectCode(console: Console, output?: LogsOutput | LogsOutput[]) {
  const outputToTerminal = output ? (output === 'terminal' || output.includes('terminal')) : true
  const outputToConsole = output ? (output === 'console' || output.includes('console')) : false
  return `const outputToTerminal = ${outputToTerminal}
const outputToConsole = ${outputToConsole}
globalThis.${console} = ${createTerminal.toString()}()

`
}


function registerMiddleware(compiler: Compiler) {
  if (!compiler.options.devServer) {
    compiler.options.devServer = {}
  }
  if (!compiler.options.devServer.setupMiddlewares) {
    compiler.options.devServer.setupMiddlewares = (middlewares) => {
      middlewares.push(terminalMiddleware());
      return middlewares
    };
  }
  const originalFn = compiler.options.devServer.setupMiddlewares;
  compiler.options.devServer.setupMiddlewares = (middlewares, devServer) => {
    if (!(middlewares || []).find(i => i.name === 'terminalMiddleware')) {
      middlewares.unshift(terminalMiddleware());
    }
    return originalFn(middlewares, devServer)
  }

}
export class WebpackTerminalPlugin {
  options: IOptions;
  constructor(options: IOptions) {
    this.options = options;
  }

  apply(compiler: Compiler) {
    const {
      console = 'console',
      output = ['console', 'terminal']
    } = this.options;
    registerMiddleware(compiler);
    const webpackVersion = require(require.resolve('webpack')).version;
    const script = generateInjectCode(console, output);
    if (this.options.externalScript) {
      let assetsHook;
      const filename = "__webpack_plugin_terminal.js";
      compiler.hooks.compilation.tap('AddAssetHtmlPlugin', compilation => {
        const hooks = HtmlWebpackPlugin.getHooks(compilation);
        let beforeGenerationHook = hooks.beforeAssetTagGeneration;
        if (webpackVersion >= 5) {
          assetsHook = compilation.hooks.processAssets
        } else {
          assetsHook = compilation.hooks.afterOptimizeAssets
        }
        beforeGenerationHook.tapPromise(
          WebpackPluginTerminalPluginName,
          async (htmlPluginData) => {
            htmlPluginData.assets.js.unshift(`./${filename}`)
            return htmlPluginData;
          }
        );
      })
      compiler.hooks.compilation.tap(WebpackPluginTerminalPluginName, (compilation) => {
        assetsHook.tap(WebpackPluginTerminalPluginName, () => {
          const rawSource = new WebpackSource.RawSource(script, true)
          if (!compilation.getAsset(filename)) {
            compilation.emitAsset(filename, rawSource);
          }
          return Boolean(filename);
        })
      })
    } else {
      compiler.hooks.compilation.tap(
        WebpackPluginTerminalPluginName,
        compilation => {
          HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tap("WebpackTerminalPlugin", (data) => {
            data.html = insertStringAfter(data.html, "<body>", `<script>
            ${script}
          </script>`)
            return data;
          })
        })
    }
  }
}