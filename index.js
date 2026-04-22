const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const P = require("pino")

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth")

  const sock = makeWASocket({
    logger: P({ level: "silent" }),
    auth: state,
    printQRInTerminal: false
  })

  // 🔗 Pairing code (FIXED)
setTimeout(async () => {
  if (!state.creds.registered) {
    const number = "2349129517597"
    const code = await sock.requestPairingCode(number)
    console.log("PAIRING CODE:", code)
  }
}, 5000)

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0]
    if (!m.message) return

    const sender = m.key.remoteJid

    const text =
      m.message.conversation ||
      m.message.extendedTextMessage?.text ||
      ""

    if (text === ".ping") {
      await sock.sendMessage(sender, { text: "🏓 Yuki is alive!" }, { quoted: m })
    }
  })
}

startBot()
