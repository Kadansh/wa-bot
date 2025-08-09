import { makeWASocket, useMultiFileAuthState } from '@whiskeysockets/baileys'
import qrcode from 'qrcode-terminal'

async function listGroups() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth')
  const sock = makeWASocket({ auth: state })

  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', async update => {
    const { connection, qr } = update
    if (qr) qrcode.generate(qr, { small: true })
    if (connection === 'open') {
      const groups = await sock.groupFetchAllParticipating()
      Object.entries(groups).forEach(([jid, meta]) =>
        console.log(jid, '→', meta.subject)
      )
      process.exit(0)
    }
  })
}

listGroups()
