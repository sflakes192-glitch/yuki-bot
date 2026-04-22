const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const P = require("pino")

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth")

  const sock = makeWASocket({
    logger: P({ level: "silent" }),
    auth: state,
    browser: ["Yuki", "Chrome", "1.0.0"]
  })

  sock.ev.on("creds.update", saveCreds)

  let pairingRequested = false

  sock.ev.on("connection.update", async (update) => {
    const { connection } = update

    if (connection === "connecting" && !pairingRequested) {
      pairingRequested = true

      try {
        const number = "2349129517597"
        const code = await sock.requestPairingCode(number)
        console.log("🔗 PAIRING CODE:", code)
      } catch (err) {
        console.log("Pairing error:", err.message)
      }
    }

    if (connection === "open") {
      console.log("✅ Yuki Connected!")
    }

    if (connection === "close") {
      console.log("❌ Connection closed, retrying...")
      startBot()
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
