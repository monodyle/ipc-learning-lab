'use strict'
import net from 'node:net'
import crypto from 'node:crypto'

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

function encode (op, data) {
  data = JSON.stringify(data)
  const len = Buffer.byteLength(data)
  const packet = Buffer.alloc(8 + len)
  packet.writeInt32LE(op, 0)
  packet.writeInt32LE(len, 4)
  packet.write(data, 8, len)
  return packet
}

const server = net.createServer(socket => {
  socket.on('data', data => {
    if (Buffer.isBuffer(data)) {
      const result = decode(data)
      console.log('receive data:', result)
      socket.write(encode(0, { message: 'Hello, ' + result.data.clientId }))
      socket.write(encode(1, { instance: crypto.randomUUID() }))
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
