import 'regenerator-runtime'
import spawn from 'cross-spawn-with-kill'
import { streamWrite, readableToString } from '@rauschma/stringio'
import readLineGenerator from './read-line-generator'
import attachDebugListeners from './attach-debug-listeners'

interface CliffordOptions {
  readDelimiter?: string | RegExp
  debug?: boolean
}

interface ReadUntilOptions {
  stopsAppearing?: boolean
}

interface CliffordInstance {
  type(string: string | Buffer | Uint8Array): Promise<void>
  read(): Promise<string>
  readLine(): Promise<string>
  readUntil(
    regex: RegExp,
    options?: ReadUntilOptions,
  ): Promise<string | undefined>
  kill(): void
}

export default function clifford(
  command: string,
  args: string[] = [],
  options: CliffordOptions = { debug: false, readDelimiter: '\n' },
): CliffordInstance {
  const cli = spawn(
    'babel-node',
    ['--extensions', '.ts,.js', '--', command, ...args],
    {
      stdio: 'pipe',
      cwd: process.cwd(),
    },
  )

  if (options.debug) {
    attachDebugListeners(cli)
  }

  const outputIterator = readLineGenerator(cli.stdout, options.readDelimiter)[
    Symbol.asyncIterator
  ]()

  return {
    type: async (string: string | Buffer | Uint8Array) =>
      streamWrite(cli.stdin, `${string}\n`),
    read: () => readableToString(cli.stdout),
    readUntil: async (matcher, options = {}) => {
      let line: string
      let appears = false

      do {
        line = (await outputIterator.next()).value
        appears = matcher.test(line)
      } while (options.stopsAppearing ? appears : !appears)

      return line
    },
    kill: () => cli.kill(),
  }
}
