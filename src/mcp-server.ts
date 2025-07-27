#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"
import { PumpChatClient } from "pump-chat-client"

interface ReadMessagesArgs {
  limit?: number
}

interface SendMessageArgs {
  message: string
}

class PumpFunChatServer {
  private server: Server
  private client: PumpChatClient | null = null
  private token: string
  private isConnected: boolean = false
  private messageBuffer: any[] = []

  constructor(token: string) {
    this.token = token
    this.server = new Server(
      {
        name: "pump-fun-chat",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    )

    this.setupHandlers()
    this.connectToChat()
  }

  private connectToChat() {
    console.error(`Connecting to pump.fun chat for token: ${this.token}`)
    
    this.client = new PumpChatClient({
      roomId: this.token,
      username: "mcp-client",
      messageHistoryLimit: 100,
    })

    // Set up event listeners
    this.client.on("connected", () => {
      this.isConnected = true
      console.error(`Successfully connected to chat room for ${this.token}`)
    })

    this.client.on("message", (message) => {
      this.messageBuffer.push(message)
      // Keep buffer size manageable
      if (this.messageBuffer.length > 1000) {
        this.messageBuffer.shift()
      }
      console.error(`New message from ${message.username}: ${message.message}`)
    })

    this.client.on("messageHistory", (messages) => {
      console.error(`Received ${messages.length} historical messages`)
    })

    this.client.on("error", (error) => {
      console.error(`Chat error:`, error)
    })

    this.client.on("serverError", (error) => {
      console.error(`Server error:`, error)
      if (error.error === "Authentication required") {
        console.error(`Note: Sending messages requires authentication with pump.fun`)
      }
    })

    this.client.on("disconnected", () => {
      this.isConnected = false
      console.error(`Disconnected from chat room`)
    })

    // Connect to the room
    this.client.connect()
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "PumpFunChat_ReadMessages",
          description: `Read messages from the pump.fun chat room for token ${this.token}`,
          inputSchema: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Number of messages to retrieve (default: all stored messages)",
              },
            },
          },
        },
        {
          name: "PumpFunChat_GetLatestMessage",
          description: `Get the most recent message from the pump.fun chat room for token ${this.token}`,
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "PumpFunChat_SendMessage",
          description: `Send a message to the pump.fun chat room for token ${this.token}`,
          inputSchema: {
            type: "object",
            properties: {
              message: {
                type: "string",
                description: "The message to send to the chat",
              },
            },
            required: ["message"],
          },
        },
        {
          name: "PumpFunChat_GetStatus",
          description: "Get the connection status and token information",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
      ],
    }))

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case "PumpFunChat_ReadMessages":
          return this.handleReadMessages(request.params.arguments as unknown as ReadMessagesArgs)
        
        case "PumpFunChat_GetLatestMessage":
          return this.handleGetLatestMessage()
        
        case "PumpFunChat_SendMessage":
          return this.handleSendMessage(request.params.arguments as unknown as SendMessageArgs)
        
        case "PumpFunChat_GetStatus":
          return this.handleGetStatus()
        
        default:
          throw new Error(`Unknown tool: ${request.params.name}`)
      }
    })
  }

  private async handleReadMessages(args: ReadMessagesArgs) {
    if (!this.client || !this.isConnected) {
      return {
        content: [
          {
            type: "text",
            text: `Not connected to the chat room. The connection may still be establishing or has failed.`,
          },
        ],
      }
    }

    const messages = this.client.getMessages(args.limit)
    
    if (messages.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No messages available. The chat might be quiet or still loading.`,
          },
        ],
      }
    }

    const formattedMessages = messages.map(msg => 
      `[${new Date(msg.timestamp).toLocaleTimeString()}] ${msg.username}: ${msg.message}`
    ).join("\n")

    return {
      content: [
        {
          type: "text",
          text: `Messages from ${this.token} (showing ${messages.length} messages):\n\n${formattedMessages}`,
        },
      ],
    }
  }

  private async handleGetLatestMessage() {
    if (!this.client || !this.isConnected) {
      return {
        content: [
          {
            type: "text",
            text: `Not connected to the chat room.`,
          },
        ],
      }
    }

    const latestMessage = this.client.getLatestMessage()
    
    if (!latestMessage) {
      return {
        content: [
          {
            type: "text",
            text: `No messages available.`,
          },
        ],
      }
    }

    return {
      content: [
        {
          type: "text",
          text: `Latest message:\n[${new Date(latestMessage.timestamp).toLocaleTimeString()}] ${latestMessage.username}: ${latestMessage.message}`,
        },
      ],
    }
  }

  private async handleSendMessage(args: SendMessageArgs) {
    if (!this.client || !this.isConnected) {
      return {
        content: [
          {
            type: "text",
            text: `Cannot send message - not connected to the chat room.`,
          },
        ],
      }
    }

    this.client.sendMessage(args.message)

    return {
      content: [
        {
          type: "text",
          text: `Message sent: "${args.message}"\nNote: Messages require pump.fun authentication to be delivered.`,
        },
      ],
    }
  }

  private async handleGetStatus() {
    return {
      content: [
        {
          type: "text",
          text: `Token: ${this.token}\nConnection Status: ${this.isConnected ? 'Connected' : 'Disconnected'}\nMessages in buffer: ${this.messageBuffer.length}`,
        },
      ],
    }
  }

  async run() {
    const transport = new StdioServerTransport()
    await this.server.connect(transport)
    console.error(`Pump.fun Chat MCP server running for token: ${this.token}`)
  }
}

// Get token from environment variable
const token = process.env.PUMP_FUN_TOKEN
if (!token) {
  console.error("Error: PUMP_FUN_TOKEN environment variable is required")
  console.error("Example: PUMP_FUN_TOKEN=y31hFyYbrVW4R53Zfka8WJfQpwpMLfCcAjVKAonpump pump-fun-chat-mcp")
  process.exit(1)
}

// Start the server
const server = new PumpFunChatServer(token)
server.run().catch(console.error)