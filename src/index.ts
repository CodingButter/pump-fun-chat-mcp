import { PumpChatClient } from "pump-chat-client"

// Example usage
const coin = "y31hFyYbrVW4R53Zfka8WJfQpwpMLfCcAjVKAonpump"

const client = new PumpChatClient({
  roomId: coin,
  username: "codingbutter",
  messageHistoryLimit: 20
})

// Set up event listeners
client.on("connected", () => {
  console.log("Connected to pump.fun chat!")
})

client.on("message", (message) => {
  console.log(`[${new Date(message.timestamp).toLocaleTimeString()}] ${message.username}: ${message.message}`)
})

client.on("messageHistory", (messages) => {
  console.log(`Received ${messages.length} historical messages`)
  messages.forEach((msg: any) => {
    console.log(`[${new Date(msg.timestamp).toLocaleTimeString()}] ${msg.username}: ${msg.message}`)
  })
})

client.on("userLeft", (data) => {
  console.log(`User ${data.username} left the chat`)
})

client.on("error", (error) => {
  console.error("Connection error:", error)
})

client.on("disconnected", () => {
  console.log("Disconnected from chat")
})

// Connect to the chat
client.connect()

// Keep the process running
process.on("SIGINT", () => {
  console.log("\nShutting down...")
  client.disconnect()
  process.exit(0)
})