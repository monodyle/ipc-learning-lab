'use strict'
import net from 'node:net'

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
    encode(0, { clientId: "nodejs" })
  )
}

getIPC().then(handleSocket)
