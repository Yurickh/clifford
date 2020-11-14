import clifford from '../src'

describe('clifford', () => {
  const command = require.resolve('./fixtures/testcli.ts')

  describe('#read', () => {
    it('reads the whole output', async () => {
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
  })

  describe('#readLine', () => {
    it('reads line by line', async () => {
      const cli = clifford(command, ['sure'])

      const firstLine = await cli.readLine()
      expect(firstLine).toEqual('Do you want to see the second line?')

      await cli.kill()
    })
  })

  describe('#findByText', () => {
    it('finds lines that are already in the screen', async () => {
      const cli = clifford(command, ['sure'])

      const firstLine = await cli.readLine()
      expect(firstLine).toEqual('Do you want to see the second line?')

      const sameLine = await cli.findByText(/want/)
      expect(sameLine).toEqual('Do you want to see the second line?')

      await cli.kill()
    })

    it('waits until new lines match, if none match still', async () => {
      const cli = clifford(command, ['sure'])

      await cli.readLine()

      await cli.type('yeah, sure')

      const secondLine = await cli.findByText('Welcome')
      expect(secondLine).toEqual('Welcome to the second line')

      await cli.untilClose()
    })
  })

  describe('#waitUntil', () => {
    it('reads until certain input is shown', async () => {
      const cli = clifford(command, ['sure'])
      cli.type('y')

      const secondLine = await cli.waitUntil('Welcome')
      expect(secondLine).toEqual('Welcome to the second line')

      await cli.untilClose()
    })
  })

  describe('#type', () => {
    it('inputs the message into the underlying process', async () => {
      const cli = clifford(command, ['sure'])

      const firstLine = await cli.readLine()
      expect(firstLine).toEqual('Do you want to see the second line?')

      await cli.type('yeah, sure')

      const secondLine = await cli.readLine()
      expect(secondLine).toEqual('Welcome to the second line')

      await cli.untilClose()
    })
  })

  it('works with simple js files', async () => {
    const cli = clifford('tests/fixtures/js-testcli.js', ['--version'])

    const version = await cli.read()
    expect(version).toMatch(/\d+\.\d+\.\d+/)

    await cli.untilClose()
  })
})
