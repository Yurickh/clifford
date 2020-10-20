import clifford from '../src'

describe('clifford', () => {
  const command = require.resolve('./fixtures/testcli.ts')

  it('gets the help', async () => {
    const cli = clifford(command, ['--help'])

    const helpText = await cli.read()
    expect(helpText).toMatchInlineSnapshot(`
      "Usage: testcli

      Commands:
        testcli sure  A nice test command

      Options:
        --version  Show version number                                       [boolean]
        --help     Show help                                                 [boolean]"
    `)
  })

  it('reads line by line and input data', async () => {
    const cli = clifford(command, ['sure'])

    const firstLine = await cli.readLine()
    expect(firstLine).toEqual('Do you want to see the second line?')

    await cli.type('yeah, sure')

    const secondLine = await cli.readLine()
    expect(secondLine).toEqual('Welcome to the second line')

    // This ensures the process is done before exiting
    await cli.kill()
  })

  it('works with simple js files', async () => {
    const cli = clifford('tests/fixtures/js-testcli.js', ['--version'])

    const version = await cli.read()
    expect(version).toMatch(/\d+\.\d+\.\d+/)
  })

  it('reads until certain input is shown', async () => {
    const cli = clifford(command, ['sure'])
    cli.type('y')

    const secondLine = await cli.waitUntil('Welcome')
    expect(secondLine).toEqual('Welcome to the second line')

    await cli.kill()
  })
})
