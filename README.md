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

    cli.kill()
  })
})
```

## Installing

```bash
npm install --save-dev clifford
```

or

```bash
yarn add --dev clifford
```

## API

### Initialization

> `clifford(binPath, args?, options?)`

```js
import clifford from 'clifford'

const cli = clifford('./path/to/your/entrypoint.js')
```

#### binPath: string

A relative path to the cwd of the writing of the test to the entry point of your project. This will be fed to `babel-node` respecting your local `.babelrc` if you have one, so you don't need to worry pointing to a built binary.

If you don't want to rely on where the tests will be run, you can pass a relative import through `require.resolve` like so:

```js
const commandPath = require.resolve('./index.ts')
const cli = clifford(commandPath)
```

#### args: string[]

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

#### options: { debug = false, readDelimiter = '\n', readTimeout = false, useBabelNode = false }

Options that modify internal behaviour.

##### debug: boolean = false

This option will print out every `stdout` that the command receives in addition to piping it to the `read` methods.

##### readDelimiter: string | RegExp = '\n'

This option changes the delimiter for the `readLine` method. By changing it, you change the definition of "line".

##### readTimeout: number | false = 1000

Max number of milisseconds to wait on a single read. Calls to `readLine` will return `undefined` if the call takes more than the time defined here.

You can opt out of using any timeout by passing `false` to `readTimeout`.

##### useBabelNode: boolean = false

Whether clifford should use `babel-node` to run your cli. Provide it as `true` if your `command` parameter points to `.ts` file, or if you want to provide some kind of transpilation step.

When false, clifford will run your cli with the `node` available in `$PATH`.

### Usage

Clifford will give you an object with the following methods:

#### cli.read

> `read: () -> Promise<string>`

```js
it('prints help', async () => {
  const cli = clifford('src/index.ts', ['--help'])
  const output = await cli.read()
  expect(output).toContain('Whatever your help prints')
})
```

`cli.read` will return you the full string output of your command.

Be mindful that if your command prompts for user data, calling `cli.read` multiple times might not work as you expect, as it flushes out the whole of `stdout` on every call. If that's your case, check `cli.readLine`.

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

`cli.readLine` will read the next line available in the `stdout` of your command. If called after `stdout` is empty, will return the empty string.

If you're reading user input in the same line as the output, you might want to change the `readDelimiter` option to something else (like `/\(y\/n\)/i`) since it doesn't print out the new line character until the input is submitted, so the promise will inevitably time out.

#### cli.readUntil

> `readUntil: (matcher: RegExp, options?: { stopsAppearing?: boolean }) => Promise<string>`

```js
it('prints the second line eventually', async () => {
  const cli = clifford('src/index.ts', ['--help'])

  const secondLine = await cli.readUntil(/second line/)
  expect(secondLine).toEqual('My second line of content')
})
```

`cli.readUntil` will read lines available in `stdout` of your cli until it reaches one that matches the regex provided in `matcher`. This is effectively the same as looping over `readLine`, so you should look out on how you configure your `readDelimiter` option.

Alternatively, you can invert the logic to keep reading until you _stop_ reading something. This is mostly useful for async processes with animated loaders, where the number of lines printed is not deterministic.

```js
it('shows result after fetching the data', async () => {
  const cli = clifford('src/index.ts', ['--fetch'])

  const afterFetching = await cli.readUntil(/Fetching your credit\.\.\./, {
    stopsAppearing: true,
  })
  expect(afterFetching).toEqual('You have credit')
})
```

#### cli.type

> `type: string -> Promise<void>`

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

`cli.type` will inject whatever you pass to it into the command's `stdin` as if it was the user typing.

#### cli.kill

```js
it('does something and never finishes', async () => {
  const cli = clifford('src/infiniteLoop.js')

  //...

  cli.kill()
})
```

Kills the cli process. Usually your process will be automatically closed as it should return, but if for some reason it doesn't, you should kill it before proceding, so you don't have memory leaks.

## Common issues

### babel-node spawn ENOENT

You either provided a file that doesn't exist to clifford, or `babel-node` is not in your path. You can provide `useBabelNode` as false, or install the peerDependencies:

```bash
yarn add --dev @babel/core @babel/node
```

If you already have `useBabelNode` as false, try `console.log(cli)` to check which path the cli is receiving.

### ReferenceError regeneratorRuntime is not defined

This means your babel config doesn't support the clifford generator. A common fix is to install `@babel/preset-env` and set it into your `.babelrc`:

```json
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": {
          "esmodules": true
        }
      }
    ]
  ]
}
```
