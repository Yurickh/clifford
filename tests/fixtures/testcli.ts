import * as readline from 'readline'
import * as yargs from 'yargs'

const RL = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

async function testcommand(): Promise<void> {
  RL.question('Do you want to see the second line?\n', answer => {
    if (answer.includes('y')) {
      console.log('Welcome to the second line')
    }

    RL.close()
  })
}

async function run(): Promise<yargs.Arguments> {
  const argv = yargs
    .scriptName('testcli')
    .usage('Usage: $0')
    .command('sure', 'A nice test command', {}, testcommand)
    .help().argv

  return argv
}

run()
