import { EventEmitter } from 'events'
import { EventQueue } from '../src/event-queue'

const runPendingListeners = () =>
  new Promise((resolve) => setImmediate(resolve))

describe('EventQueue', () => {
  // Not proud of this one, but this ensures a really specific bug is not in place
  it('reads from lag', async () => {
    const emitter = new EventEmitter()
    const queue = new EventQueue(emitter, 'potato')

    emitter.emit('potato')
    emitter.emit('potato')
    emitter.emit('potato')

    expect((queue as any).readPointer).toBe(0)
    expect((queue as any).writePointer).toBe(3)
  })

  it('calls next when event is emitted', async () => {
    const emitter = new EventEmitter()
    const queue = new EventQueue(emitter, 'potato')

    let nextHasBeenCalled = false

    queue.next().then(() => {
      nextHasBeenCalled = true
    })

    await runPendingListeners()
    expect(nextHasBeenCalled).toBe(false)

    emitter.emit('potato')

    await runPendingListeners()
    expect(nextHasBeenCalled).toBe(true)
  })

  it('calls next immediately if there is event in lag', async () => {
    const emitter = new EventEmitter()
    const queue = new EventQueue(emitter, 'potato')

    let nextHasBeenCalledTimes = 0

    emitter.emit('potato')

    queue.next().then(() => {
      nextHasBeenCalledTimes++
    })

    expect(nextHasBeenCalledTimes).toBe(0)
    await runPendingListeners()
    expect(nextHasBeenCalledTimes).toBe(1)
  })
})
