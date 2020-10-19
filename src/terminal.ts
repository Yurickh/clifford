import AnsiParser from 'node-ansiparser'
import { AnsiTerminal } from 'node-ansiterminal'

export class Terminal {
  parser: AnsiParser
  terminal: AnsiTerminal

  constructor() {
    this.terminal = new AnsiTerminal(1000, 1000, Infinity)
    this.parser = new AnsiParser(this.terminal)
  }

  public read() {
    return this.terminal.toString()
  }

  public write(chunk: string) {
    return this.parser.parse(chunk)
  }
}
