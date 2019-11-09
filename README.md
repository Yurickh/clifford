# Clifford

Simple CLI Integration testing

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

A global or relative path to the entry point of your project. This will be fed to `babel-node` respecting your local `.babelrc` if you have one, so you don't need to worry pointing to a built binary.

#### args: string[]

An array with the parameters to be passed to the cli. If you want to run it with `--help`, for example, you would do like so:

```js
const cli = clifford('./index.ts', ['--help'])
```

If you're familiar with `child_process` usage, this is similar to the second parameter of [child_process.spawn](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options).

Be mindful to always split your arguments when you would introduce a space.

```js
// equivalent to ./index.ts --extensions .ts
const cli = clifford('./index.ts', ['--extensions', '.ts'])
```

#### options: { debug = false, readDelimiter = '\n' }

Options that modify internal behaviour.

##### debug: boolean

This option will print out every `stdout` that the command receives in addition to piping it to the `read` methods.

##### readDelimiter: string | RegExp

This option changes the delimiter for the `readLine` method. By changing it, you change the definition of "line".

### Usage

Clifford will give you an object with the following methods:

#### cli.read

> `read: () -> Promise<string>`

```js
it('prints help', async () => {
  const cli = clifford('./index.ts', ['--help'])
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
  const cli = clifford('./index.ts', ['--help'])

  const firstLine = await cli.readLine()
  expect(firstLine).toEqual('My first line of content')

  const secondLine = await cli.readLine()
  expect(secondLine).toEqual('My second line of content')
})
```

`cli.readLine` will read the next line available in the `stdout` of your command. If called after `stdout` is empty, will return the empty string.

If you're reading user input in the same line as the output, you might want to change the `readDelimiter` option to something else (like `/\(y\/n\)/i`) since it doesn't print out the new line character until the input is submitted, so the promise will inevitably time out.

#### cli.type

> `type: string -> Promise<void>`

```js
it('prompts if user wants to continue', async () => {
  const cli = clifford('./index.ts', ['--help', '--prompt'])

  const firstLine = await cli.readLine()
  expect(firstLine).toEqual('Do you want to read the next line?')

  await cli.type('yes')

  const secondLine = await cli.readLine()
  expect(secondeLine).toEqual('Welcome to the second line')
})
```

`cli.type` will inject whatever you pass to it into the command's `stdin` as if it was the user typing.
