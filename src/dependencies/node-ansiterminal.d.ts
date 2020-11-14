declare module 'node-ansiterminal' {
  export class AnsiTerminal {
    constructor(cols: number, rows: number, scroll: number)
    toString(): string

    // TODO: Consider adding all methods exposed by the ansiterminal
  }
}
