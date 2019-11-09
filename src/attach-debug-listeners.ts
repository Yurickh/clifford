import { ChildProcess } from 'child_process'

export default function attachDebugListeners(cli: ChildProcess): void {
  cli.stdin.on('data', data => {
    console.log('[stdin]: ', data.toString(), '[/stdin]')
  })

  cli.stdout.on('data', data => {
    console.log('[stdout]: ', data.toString(), '[/stdout]')
  })

  cli.stderr.on('data', data => {
    console.log('[stderr]: ', data.toString(), '[/stderr]')
  })
}
