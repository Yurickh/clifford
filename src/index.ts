import execa from 'execa'
import { Reader } from './reader'

interface CliffordOptions {
  readTimeout: number | false
  debug: boolean
  useBabelNode: boolean
  replacers: ((chunk: string) => string)[]
}

const defaultConfig = (command: string) => ({
  debug: false,
  readTimeout: 1000,
  useBabelNode: !command.endsWith('.js'),
  replacers: [],
})

const execaOptions = () => ({
  all: true,
  preferLocal: true,
})

const spawnNode = (command: string, args: string[]) =>
  execa('node', ['--', command, ...args], execaOptions())

const spawnBabelNode = (command: string, args: string[]) =>
  execa(
    'babel-node',
    ['--extensions', '.ts,.js', '--', command, ...args],
    execaOptions(),
  )

export default function clifford(
  command: string,
  args: string[] = [],
  options: Partial<CliffordOptions> = {},
) {
  const optionsWithDefault: CliffordOptions = {
    ...defaultConfig(command),
    ...options,
  }

  const spawner = optionsWithDefault.useBabelNode ? spawnBabelNode : spawnNode
  const cli = spawner(command, args)

  const stringification = `[Clifford instance: running process for \`${command}\` with args \`${JSON.stringify(
    args,
  )}\` ]`

  if (cli.all === undefined) {
    throw new Error('[Clifford]: stdio of spawn has been misconfigured')
  }

  const reader = new Reader(cli.all, {
    debug: optionsWithDefault.debug,
    replacers: optionsWithDefault.replacers,
  })

  const untilClose = () =>
    Promise.race([
      reader.untilClose(),
      new Promise((resolve) => {
        cli.once('close', resolve)
      }),
    ])

  return {
    // Although we don't need await here, it seems `write` might be async on windows
    type: async (string: string) => {
      if (cli.stdin === null) {
        throw new Error('[Clifford]: stdio of spawn has been misconfigured')
      }
      cli.stdin.write(`${string}\n`)
    },
    read: () => cli.then(({ all }) => all),
    findByText: (matcher: string | RegExp) => reader.findByText(matcher),
    readScreen: () => reader.readScreen(),
    readUntil: (matcher: string | RegExp) => reader.until(matcher),
    readLine: () => reader.until(undefined),
    untilClose,
    kill: () => {
      cli.cancel()
      return untilClose()
    },
    toString: () => stringification,
    toJSON: () => stringification,
  }
}
