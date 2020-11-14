# Clifford

Simple CLI Integration testing

```js
import clifford from 'clifford'

describe('my cli', () => {
  it('shows help', async () => {
    const cli = clifford('src/index.ts', ['--help'])

    const helpText = await cli.read()
    expect(helpText).toMatchInlineSnapshot(`
      "Usage: testcli

      Commands:
        testcli sure  A nice test command

      Options:
        --version  Show version number                                       [boolean]
        --help     Show help                                                 [boolean]
      "
    `)
  })

  it('reads line by line and input data', async () => {
    const cli = clifford('src/index.ts', ['sure'])

    const firstLine = await cli.readLine()
    expect(firstLine).toEqual('Do you want to see the second line?')

    await cli.type('yeah, sure')

    const secondLine = await cli.readLine()
    expect(secondLine).toEqual('Welcome to the second line')
  })
})
```

## Installing

```bash
yarn add --dev clifford
```

or

```bash
npm install --save-dev clifford
```

## API

### Initialization

> `clifford(binPath, args?, options?)`

```js
import clifford from 'clifford'

const cli = clifford('./path/to/your/entrypoint.js')
```

#### binPath: string

| Type     | default  |
| -------- | -------- |
| `string` | required |

A relative path to the cwd to the entry point of your project. This will be fed to `babel-node` respecting your local `.babelrc` if you have one, so you don't need to worry to build your TS before running your tests.

If you don't want to rely on where the tests will be run, you can pass a relative import through `require.resolve` like so:

```js
const commandPath = require.resolve('./index.ts')
const cli = clifford(commandPath)
```

#### args

| Type            | default |
| --------------- | ------- |
| `Array<string>` | `[]`    |

An array with the parameters to be passed to the cli. If you want to run it with `--help`, for example, you would do like so:

```js
const cli = clifford('src/index.ts', ['--help'])
```

If you're familiar with `child_process` usage, this is similar to the second parameter of [child_process.spawn](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options).

Be mindful to always split your arguments when you would introduce a space.

```js
// equivalent to ./index.ts --extensions .ts
const cli = clifford('src/index.ts', ['--extensions', '.ts'])
```

#### options

Options that modify internal behaviour.

##### debug

| Type      | default |
| --------- | ------- |
| `boolean` | `false` |

This option will print out every `stdout` that the command receives in addition to piping it to the `read` methods.

##### useBabelNode

| Type      | default                                                             |
| --------- | ------------------------------------------------------------------- |
| `boolean` | `true` if `.babelrc` is present, or if you point to a non-`js` file |

Whether clifford should use `babel-node` to run your cli. Provide it as `true` if your `command` parameter points to `.ts` file, or if you want to provide some kind of transpilation step.

When false, clifford will run your cli with the `node` available in `$PATH`.

### Usage

Clifford will give you a clifford instance with the following methods:

#### cli.read

> `read: () -> Promise<string>`

```js
it('prints help', async () => {
  const cli = clifford('src/index.ts', ['--help'])
  const output = await cli.read()
  expect(output).toContain('Whatever your help prints')
})
```

`cli.read` reads the process' output until its exit event.

Be mindful that if your cli hangs for any reason (e.g. waits for user input) this method will timeout, since it will wait for the process end.

#### cli.readLine

> `readLine: () -> Promise<string>`

```js
it('prints help gradually', async () => {
  const cli = clifford('src/index.ts', ['--help'])

  const firstLine = await cli.readLine()
  expect(firstLine).toEqual('My first line of content')

  const secondLine = await cli.readLine()
  expect(secondLine).toEqual('My second line of content')
})
```

`cli.readLine` returns the next line printed in the screen. In case there's no line to be read in the screen, it will wait until a new one has been printed.

#### cli.findByText

> `findByText: (matcher: string | RegExp) => Promise<string>`

```js
it('prints the second line eventually', async () => {
  const cli = clifford('src/index.ts', ['--help'])

  const secondLine = await cli.findByText(/second line/)
  expect(secondLine).toEqual('My second line of content')
})
```

`cli.findByText` finds a line in the screen and returns it. It will return the first line it finds, including lines that have already been read. In case no line in the current screen satisfies the provided matcher, it will wait until something that is printed does.

#### cli.waitUntil

> `waitUntil: (matcher: string | RegExp) -> Promise<string>`

```js
it('prints a message before closing', async () => {
  const cli = clifford('src/index.ts', ['--help'])

  const lastLine = await waitUntil('a message')
  expect(lastLine).toEqual("I've sent a message")
})
```

`cli.waitUntil` waits util a line satisfies the matcher provided. It won't look at lines that have already been read, so use it only if you're sure that the line you're looking for is not already flushed to the screen. If you want to match already read lines, use `findByText`.

#### cli.type

> `type: (messageToType: string) -> Promise<void>`

```js
it('prompts if user wants to continue', async () => {
  const cli = clifford('src/index.ts', ['--help', '--prompt'])

  const firstLine = await cli.readLine()
  expect(firstLine).toEqual('Do you want to read the next line?')

  await cli.type('yes')

  const secondLine = await cli.readLine()
  expect(secondeLine).toEqual('Welcome to the second line')
})
```

`cli.type` types a string to the process. This will ultimately write the string provided to the process' stdin feed.

#### cli.kill

> `kill: () -> Promise<void>`

```js
it('does something and never finishes', async () => {
  const cli = clifford('src/infiniteLoop.js')

  //...

  await cli.kill()
})
```

`cli.kill` kills the process and waits until its streams are properly closed. It's advised you wait for this method at the end of tests that don't go through the process until it self-closes.

#### cli.untilClose

> `untilClose: () -> Promise<void>`

```js
it('takes kind of long to close', () => {
  const cli = clifford('src/moveStuffInADatabase.js')

  // ...

  await cli.untilClose()
})
```

`cli.untilClose` will wait until the underlying process has closed. It's effectively the same as `cli.kill` except it won't trigger the closing of the process itself.

## Common issues

### babel-node spawn ENOENT

You either provided a file that doesn't exist to clifford, or `babel-node` is not in your path. You can provide `useBabelNode` as false, or install the peerDependencies:

```bash
yarn add --dev @babel/core @babel/node
```

If you already have `useBabelNode` as false, try `console.log(cli)` to check which path the cli is receiving.

### Jest did not exit one second after the test run has completed

This usually means your underlying process has been left hanging in one of your test cases. Try adding `cli.untilClose` to the end of your tests and see which one times out, so you can properly `cli.kill` it.
