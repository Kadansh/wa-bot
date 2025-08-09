// unlock.js
import pkg from '@whiskeysockets/baileys'
import qrcode from 'qrcode-terminal'

const { makeWASocket, useMultiFileAuthState, DisconnectReason } = pkg

// const GROUP_JID = '120363401064874173@g.us' // your group - ITS
const GROUP_JID = '120363402460230782@g.us' // your group - Kadan Test

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth')
  const sock = makeWASocket({ auth: state })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) qrcode.generate(qr, { small: true })

    if (connection === 'open') {
      await sock.groupSettingUpdate(GROUP_JID, 'not_announcement') // everyone can send
      console.log('Group sending unlocked (everyone can send).')
      process.exit(0)
    }

    if (connection === 'close') {
      const status = lastDisconnect?.error?.output?.statusCode
      if (status === DisconnectReason.restartRequired) return start()
      if (status === DisconnectReason.loggedOut) {
        console.error('Logged out. Delete ./auth and re-pair.')
        process.exit(1)
      }
      console.error('Connection closed with status:', status)
      process.exit(1)
    }
  })
}

start()
