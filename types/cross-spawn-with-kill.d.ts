declare module 'cross-spawn-with-kill' {
  import spawn from 'cross-spawn'

  export default function spawnWithKill(
    ...params: Parameters<typeof spawn>
  ): ReturnType<typeof spawn> & { kill: () => void }
}
