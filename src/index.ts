import spawn from 'cross-spawn-with-kill'
import { streamWrite, readableToString } from '@rauschma/stringio'
import readLineGenerator from './read-line-generator'
import attachDebugListeners from './attach-debug-listeners'

interface CliffordOptions {
  readDelimiter?: string | RegExp
  debug?: boolean
}

interface CliffordInstance {
  type(string: string | Buffer | Uint8Array): Promise<void>
  read(): Promise<string>
  readLine(): Promise<string>
  kill(): void
}

export default function clifford(
  command: string,
  args: string[] = [],
  options: CliffordOptions = { debug: false, readDelimiter: '\n' },
): CliffordInstance {
  const cli = spawn(
    'babel-node',
    ['--extensions', '.ts', '--', command, ...args],
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
    readLine: () => outputIterator.next().then(({ value }) => value),
    kill: () => cli.kill(),
  }
}
