import { EventEmitter } from 'events'
import { Readable } from 'stream'
import { TextDecoder } from 'util'
import { Terminal } from '../terminal'
import { EventQueue } from '../event-queue'
import { commonLeadingString } from './common-leading-string'
import { isRegExp } from './is-regexp'

// There's a question of using `EOL` from 'os', but it seems to behave differently on windows
const EOL = '\n'

interface ReaderConfig {
  replacers?: ((chunk: string) => string)[]
  debug?: boolean
}

/**
 * Normalizes the chunk so its read the same accross platforms.
 * @param chunk A chunk of the readable stream of cli.all
 */
const normalizeChunk = (
  chunk: Uint8Array,
  replacers: ((chunk: string) => string)[],
) => {
  const newBuffer = new Uint8Array(
    Array.from(chunk).reduce((chunk, char) => {
      return [...chunk, ...(char === 10 ? [10, 13] : [char])]
    }, [] as number[]),
  )

  return replacers.reduce(
    (string, replacer) => replacer(string),
    new TextDecoder().decode(newBuffer),
  )
}

function test(matcher: string | RegExp): (subject: string) => boolean
function test(matcher: string | RegExp, subject: string): boolean
function test(matcher: string | RegExp, subject?: string) {
  const applyMatcher = (subject: string) => {
    if (isRegExp(matcher)) {
      return matcher.test(subject)
    } else {
      return subject.includes(matcher)
    }
  }

  if (subject === undefined) {
    return applyMatcher
  }

  return applyMatcher(subject)
}

class LineFeedEmitter extends EventEmitter {}

export class Reader {
  screen: string
  terminal: Terminal
  debug: boolean
  lineFeedEmitter: LineFeedEmitter

  constructor(private stream: Readable, config: ReaderConfig) {
    this.screen = ''
    this.terminal = new Terminal()
    this.debug = config.debug ?? false
    this.lineFeedEmitter = new LineFeedEmitter()

    this.startListening(config.replacers)
  }

  private startListening(replacers: ((chunk: string) => string)[] = []) {
    this.stream.on('data', (chunk) => {
      normalizeChunk(chunk, replacers)
        .split(EOL)
        .forEach((chunkLine, index, array) => {
          // We want to setImmediate so each line feed is reacted to independently
          setImmediate(() => {
            this.terminal.write(
              chunkLine + (index + 1 === array.length ? '' : EOL),
            )
            this.lineFeedEmitter.emit('line')

            if (this.debug) {
              console.info(
                '=====[Clifford screen]=====\n',
                this.readScreen(),
                '\n===========================',
              )
            }
          })
        })
    })
  }

  private updateScreen() {
    const currentScreen = this.screen
    const terminalScreen = this.readScreen()

    if (terminalScreen.startsWith(currentScreen)) {
      const diff = terminalScreen.slice(currentScreen.length)
      const [firstLineOfDiff] = diff.split(EOL)

      // We want to skip overriding the whole screen if the client cleans up the screen to
      // prepare the next print. Instead, we rely that the startsWith check will take care
      // of cleaning up if everything is changed.
      if (terminalScreen !== '') {
        this.screen += firstLineOfDiff + EOL
      }

      return firstLineOfDiff
    } else {
      const commonBase = commonLeadingString(currentScreen, terminalScreen)
      const diff = terminalScreen.slice(commonBase.length)
      const [firstLineOfDiff] = diff.split(EOL)

      if (terminalScreen !== '') {
        this.screen = commonBase + firstLineOfDiff + EOL
      }

      return firstLineOfDiff
    }
  }

  public readScreen() {
    return this.terminal.read().trimRight()
  }

  /**
   * Method to wait until a line is printed with a given string.
   * @param matcher The string you're looking for, or a regex expression to match.
   */
  public async until(matcher: string | RegExp | undefined) {
    const eventQueue = new EventQueue(this.lineFeedEmitter, 'line')
    do {
      // We update the screen on every iteration so we get only the final chunk by the end
      const diff = this.updateScreen()

      if (matcher === undefined) {
        if (diff !== '') {
          return diff
        }
      } else {
        if (test(matcher, diff)) {
          eventQueue.dispose()
          return diff
        }
      }
    } while (await eventQueue.next())

    // There should be no way of getting out of the loop above.
    // Let ts know that.
    return undefined as never
  }

  /**
   * Method to find a line in the screen that matches the matcher.
   * Will search from bottom to top and return the first line that matches.
   * @param matcher The screen you're looking for, or a regex expression to match.
   */
  public async findByText(matcher: string | RegExp) {
    const screen = this.readScreen()

    if (!test(matcher, screen)) {
      return this.until(matcher)
    }

    const line = screen.split(EOL).reverse().find(test(matcher))

    if (line === undefined) {
      // TODO: use invariants instead
      throw new Error(
        '[Clifford]: findByText has found nothing, even though test found a match. This should never happen, please let the mainters of clifford know by opening an issue at https://github.com/Yurickh/clifford/issues/new',
      )
    }

    return line
  }
}