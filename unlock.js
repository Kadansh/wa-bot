// unlock.js
import pkg from '@whiskeysockets/baileys'
import qrcode from 'qrcode-terminal'

const { makeWASocket, useMultiFileAuthState, DisconnectReason } = pkg

const GROUP_JIDS = (process.env.GROUP_JIDS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth')
  const sock = makeWASocket({ auth: state })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) qrcode.generate(qr, { small: true })

    if (connection === 'open') {
      if (GROUP_JIDS.length === 0) {
        console.error('No GROUP_JIDS provided'); process.exit(1)
      }
      for (const jid of GROUP_JIDS) {
        try {
          await sock.groupSettingUpdate(jid, 'not_announcement')
          console.log(`Unlocked ${jid}`)
        } catch (e) {
          console.error(`Failed to unlock ${jid}:`, e?.message || e)
        }
      }
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
