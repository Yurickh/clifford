/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-var-requires */

const readline = require('readline')
const yargs = require('yargs')

const RL = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

async function testcommand() {
  RL.question('Do you want to see the second line?\n', answer => {
    if (answer.includes('y')) {
      console.log('Welcome to the second line')
    }

    RL.close()
  })
}

async function run() {
  const argv = yargs
    .scriptName('testcli')
    .usage('Usage: $0')
    .command('sure', 'A nice test command', {}, testcommand)
    .help().argv

  return argv
}

run()
