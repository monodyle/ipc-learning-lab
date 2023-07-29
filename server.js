'use strict'
import net from 'node:net'

const ipcPath = `\\\\?\\pipe\\ipc-0`

/**
 * @typedef {Object} MessageInstruction
 * @property {number}  op    operation code
 * @property {Object}  data  data payload
 */

/**
 * decode packet content
 * @param {Buffer} packet
 * @returns {MessageInstruction}
 */
function decode (packet) {
  const op = packet.readInt32LE(0)
  const len = packet.readInt32LE(4)
  const data = JSON.parse(packet.toString('utf8', 8, 8 + len))
  return { op, data }
}

const server = net.createServer(socket => {
  socket.on('data', data => {
    if (Buffer.isBuffer(data)) {
      console.log('receive data:', decode(data))
      return
    }
    console.log('received data (not a buffer):', data)
  })
  socket.on('end', () => {
    console.log('client disconnected')
  })
})

server.on('error', error => {
  throw error
})

server.listen(ipcPath, () => {
  console.log('opened server on', server.address())
})
