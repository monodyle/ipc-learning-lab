'use strict'
import net from 'node:net'

const [_, __, clientId] = process.argv

function getIPC () {
  return new Promise((resolve, reject) => {
    const path = `\\\\?\\pipe\\ipc-0`
    console.debug('getIPC', { path })
    const onerror = () => {
      reject(new Error('Could not connect'))
    }
    const sock = net.createConnection(path, () => {
      sock.removeListener('error', onerror)
      resolve(sock)
    })
    sock.once('error', onerror)
  })
}

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

/**
 * @param {net.Socket} socket
 */
const handleSocket = socket => {
  socket.write(
    encode(0, { clientId: clientId || "nodejs" })
  )
  socket.on('data', (data) => console.log(decode(data)))
}

getIPC().then(handleSocket)
