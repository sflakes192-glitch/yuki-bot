const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const P = require("pino")

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth")

  const sock = makeWASocket({
    logger: P({ level: "silent" }),
    auth: state
  })

  sock.ev.on("creds.update", saveCreds)

  // ✅ WAIT FOR CONNECTION BEFORE PAIRING
  sock.ev.on("connection.update", async (update) => {
    const { connection } = update

    if (connection === "open") {
      console.log("✅ Connected to WhatsApp")
    }

    if (connection === "close") {
      console.log("❌ Connection closed, retrying...")
      startBot()
    }

    // 🔗 SAFE PAIRING (NO MORE 428 ERROR)
    if (!state.creds.registered && connection === "connecting") {
      const number = "2349129517597"
      const code = await sock.requestPairingCode(number)
      console.log("PAIRING CODE:", code)
    }
  })

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
