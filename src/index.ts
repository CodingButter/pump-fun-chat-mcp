/**
 * @fileoverview Example usage of pump-chat-client.
 * This file demonstrates how to use the pump-chat-client library
 * to connect to a pump.fun token chat room and handle various events.
 * 
 * @module pump-fun-chat-mcp/example
 * @author codingbutter
 * @license MIT
 */

import { PumpChatClient } from "pump-chat-client"

/**
 * Example token address to connect to.
 * Replace this with your desired pump.fun token address.
 * @const {string}
 */
const coin = "y31hFyYbrVW4R53Zfka8WJfQpwpMLfCcAjVKAonpump"

/**
 * Create a new PumpChatClient instance.
 * This client will connect to the specified token's chat room.
 */
const client = new PumpChatClient({
  roomId: coin,                    // The token address to connect to
  username: "codingbutter",        // Username that will appear in chat
  messageHistoryLimit: 20          // Store only the last 20 messages in memory
})

/**
 * Set up event listeners for the chat client.
 * These handlers will respond to various events from the chat room.
 */

/**
 * Handle successful connection to the chat room.
 * This event fires when the WebSocket connection is established
 * and the room join is confirmed.
 */
client.on("connected", () => {
  console.log("Connected to pump.fun chat!")
  console.log(`Monitoring token: ${coin}`)
  console.log("Waiting for messages...")
})

/**
 * Handle new incoming messages.
 * This event fires whenever a user posts a new message in the chat.
 * @param {Object} message - The message object
 * @param {string} message.username - Username of the sender
 * @param {string} message.message - The message content
 * @param {string} message.timestamp - ISO timestamp of the message
 */
client.on("message", (message) => {
  // Format and display the message with timestamp
  const time = new Date(message.timestamp).toLocaleTimeString()
  console.log(`[${time}] ${message.username}: ${message.message}`)
})

/**
 * Handle message history received from the server.
 * This typically happens right after joining the room.
 * The server sends recent messages to provide context.
 * @param {Array} messages - Array of historical message objects
 */
client.on("messageHistory", (messages) => {
  console.log(`\n=== Received ${messages.length} historical messages ===`)
  
  // Display each historical message
  messages.forEach((msg: any) => {
    const time = new Date(msg.timestamp).toLocaleTimeString()
    console.log(`[${time}] ${msg.username}: ${msg.message}`)
  })
  
  console.log("=== End of history ===\n")
})

/**
 * Handle user leave events.
 * This event fires when a user leaves the chat room.
 * @param {Object} data - User leave event data
 * @param {string} data.username - Username of the user who left
 */
client.on("userLeft", (data) => {
  console.log(`👋 User ${data.username} left the chat`)
})

/**
 * Handle connection errors.
 * These could be network issues, protocol errors, or other problems.
 * @param {Error} error - The error object
 */
client.on("error", (error) => {
  console.error("❌ Connection error:", error.message || error)
})

/**
 * Handle disconnection from the chat room.
 * This could be due to network issues or explicit disconnection.
 * The client will automatically attempt to reconnect.
 */
client.on("disconnected", () => {
  console.log("🔌 Disconnected from chat")
  console.log("Attempting to reconnect...")
})

/**
 * Handle max reconnection attempts reached.
 * This event fires when the client has failed to reconnect
 * after the maximum number of attempts.
 */
client.on("maxReconnectAttemptsReached", () => {
  console.error("❌ Failed to reconnect after maximum attempts")
  console.error("Please check your connection and restart the application")
  process.exit(1)
})

/**
 * Start the connection to the chat room.
 * This initiates the WebSocket connection and begins the handshake process.
 */
console.log(`Connecting to pump.fun chat for token: ${coin}`)
client.connect()

/**
 * Set up graceful shutdown handler.
 * This ensures the WebSocket connection is properly closed
 * when the process is terminated (e.g., Ctrl+C).
 */
process.on("SIGINT", () => {
  console.log("\n\n🛑 Shutting down...")
  
  // Disconnect from the chat room
  client.disconnect()
  
  // Exit the process
  console.log("👋 Goodbye!")
  process.exit(0)
})

/**
 * Optional: Send a test message after 5 seconds.
 * Note: This will only work if you're authenticated with pump.fun.
 * Uncomment the code below to test sending messages.
 */
/*
setTimeout(() => {
  console.log("\n📤 Attempting to send a test message...")
  client.sendMessage("Hello from pump-chat-client! 👋")
  console.log("Note: Message will only be delivered if authenticated with pump.fun")
}, 5000)
*/

/**
 * Optional: Demonstrate other client methods.
 * Uncomment the code below to see how to use other features.
 */
/*
// Get stored messages after 10 seconds
setTimeout(() => {
  console.log("\n📊 Current message statistics:")
  const allMessages = client.getMessages()
  console.log(`Total messages stored: ${allMessages.length}`)
  
  const latest = client.getLatestMessage()
  if (latest) {
    console.log(`Latest message from: ${latest.username}`)
    console.log(`Latest message: "${latest.message}"`)
  }
  
  console.log(`Connection status: ${client.isActive() ? 'Active' : 'Inactive'}`)
}, 10000)
*/