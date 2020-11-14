import execa from 'execa'
import { Reader } from './reader'

export interface CliffordOptions {
  readTimeout?: number | false
  debug?: boolean
  useBabelNode?: boolean
  replacers?: ((chunk: string) => string)[]
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

type Unpartial<T> = { [k in keyof T]-?: T[k] }

class CliffordInstance {
  /**
   * The options provided to the clifford instance at its construction.
   */
  private options: Unpartial<CliffordOptions>
  /**
   * The child process pointer.
   */
  private cli: execa.ExecaChildProcess<string>
  /**
   * The instance that reads and formats the process' output
   */
  private reader: Reader
  /**
   * Flags the underlying process has been closed
   */
  private isDead: boolean

  constructor(
    private command: string,
    private args: string[],
    options: CliffordOptions,
  ) {
    this.options = {
      ...defaultConfig(command),
      ...options,
    }

    const spawner = this.options.useBabelNode ? spawnBabelNode : spawnNode
    this.cli = spawner(command, args)

    if (this.cli.all === undefined) {
      throw new Error('[Clifford]: stdio of spawn has been misconfigured')
    }

    this.reader = new Reader(this.cli.all, {
      debug: this.options.debug,
      replacers: this.options.replacers,
    })

    this.isDead = false
    this.cli.once('close', () => (this.isDead = true))
    this.cli.once('exit', () => (this.isDead = true))
  }

  /**
   * Type a string to the process.
   * This will ultimately write the string provided to the process' stdin feed.
   *
   * @param string The string to be typed.
   */
  public async type(string: string) {
    if (this.cli.stdin === null) {
      throw new Error('[Clifford]: stdio of spawn has been misconfigured')
    }
    this.cli.stdin.write(`${string}\n`)
  }

  /**
   * Read the process' output until it's exit event.
   *
   * WARNING! This _will_ timeout if your process hangs for any reason,
   * i.e. if it waits for user input.
   */
  public read() {
    return this.cli.then(({ all }) => {
      if (all === undefined) {
        throw new Error(
          '[Clifford]: `all` appears to be undefined during a CliffordInstance#read call. This should never happen if stdio of spawn is properly configured. Please let the mainters of clifford know by opening an issue at https://github.com/Yurickh/clifford/issues/new',
        )
      }

      return all
    })
  }

  /**
   * Returns the next line printed in the screen.
   * In case there's no line to be read in the screen, wait until a new one has been printed.
   *
   * WARNING! This _will_ timeout if your process hands for any reason,
   * i.e. if it waits for user input.
   */
  public readLine() {
    return this.reader.until(undefined)
  }

  /**
   * Finds a line in the screen and returns it.
   * It will return the first line it finds, including lines that have already been read.
   * In case no line in the current screen satisfies the provided matcher, wait until something
   * that is printed does.
   *
   * WARNING! This _will_ timeout if your process hangs for any reason,
   * i.e. if it waits for user input.
   *
   * @param matcher A string or regex we should use to match lines and find a
   * piece of text in the screen.
   */
  public findByText(matcher: string | RegExp) {
    return this.reader.findByText(matcher)
  }

  /**
   * Waits util a line satisfies the matcher provided.
   * It won't look lines that already been read, so use it only if you're sure that
   * the line you're looking for is not already flushed to the screen.
   *
   * WARNING! This _will_ timeout if your process hands for any reason,
   * i.e. if it waits for user input.'
   *
   * @param matcher A string or regex we should use to match lines and find a
   * piece of text in the screen.
   */
  public waitUntil(matcher: string | RegExp) {
    return this.reader.until(matcher)
  }

  /**
   * Kills the process and waits until its streams are properly closed.
   * It's advised you wait for this method at the end of tests that don't go through
   * the process until it self-closes.
   */
  public async kill() {
    this.cli.cancel()

    await this.untilClose()
  }

  public untilClose() {
    return new Promise<void>((resolve) => {
      this.isDead ? resolve() : this.cli.once('close', resolve)
    })
  }

  /**
   * A more readable alternative to the default [object Object]
   * Will be used in all kinds of stringification, e.g. `potato: ${cliffordInstance}`
   */
  toString() {
    return `[CliffordInstance: running process for \`${
      this.command
    }\` with args \`${JSON.stringify(this.args)}\` ]`
  }
}

export default function clifford(
  command: string,
  args: string[] = [],
  options: CliffordOptions = {},
) {
  return new CliffordInstance(command, args, options)
}
