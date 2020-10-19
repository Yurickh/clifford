declare module 'node-ansiparser' {
  import { AnsiTerminal } from 'node-ansiterminal'

  export default class AnsiParser {
    constructor(terminal: AnsiTerminal)

    parse(string: string): void
  }
}
