#!/usr/bin/env node

/**
 * @fileoverview MCP Server for pump.fun chat integration.
 * This server implements the Model Context Protocol (MCP) to allow AI assistants
 * like Claude to interact with pump.fun token chat rooms through standardized tools.
 * 
 * @module pump-fun-chat-mcp
 * @author codingbutter
 * @license MIT
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"
import { PumpChatClient } from "pump-chat-client"

/**
 * Arguments for the ReadMessages tool.
 * @interface ReadMessagesArgs
 * @property {number} [limit] - Optional limit on number of messages to retrieve
 */
interface ReadMessagesArgs {
  limit?: number
}

/**
 * Arguments for the SendMessage tool.
 * @interface SendMessageArgs
 * @property {string} message - The message text to send to the chat
 */
interface SendMessageArgs {
  message: string
}

/**
 * Main MCP server class that manages the pump.fun chat connection
 * and exposes tools for AI assistants to interact with the chat.
 * 
 * @class PumpFunChatServer
 * @example
 * ```typescript
 * const server = new PumpFunChatServer('YOUR_TOKEN_ADDRESS');
 * server.run();
 * ```
 */
class PumpFunChatServer {
  /** MCP server instance that handles protocol communication */
  private server: Server
  
  /** PumpChatClient instance for WebSocket communication with pump.fun */
  private client: PumpChatClient | null = null
  
  /** The token address/room ID we're connected to */
  private token: string
  
  /** Current connection state of the chat client */
  private isConnected: boolean = false
  
  /** 
   * Buffer for storing incoming messages.
   * This allows the MCP server to access messages even if the client
   * wasn't actively listening when they arrived.
   */
  private messageBuffer: any[] = []

  /**
   * Creates a new PumpFunChatServer instance.
   * @param {string} token - The pump.fun token address to connect to
   * @constructor
   */
  constructor(token: string) {
    this.token = token
    
    // Initialize the MCP server with metadata
    this.server = new Server(
      {
        name: "pump-fun-chat",
        version: "1.0.0",
      },
      {
        // Declare that this server provides tools
        capabilities: {
          tools: {},
        },
      }
    )

    // Set up MCP request handlers
    this.setupHandlers()
    
    // Connect to the pump.fun chat room
    this.connectToChat()
  }

  /**
   * Establishes connection to the pump.fun chat room.
   * Sets up all necessary event listeners for the chat client.
   * @private
   */
  private connectToChat() {
    // Log connection attempt (using stderr to avoid interfering with MCP protocol)
    console.error(`Connecting to pump.fun chat for token: ${this.token}`)
    
    // Create a new chat client instance
    this.client = new PumpChatClient({
      roomId: this.token,
      username: "mcp-client", // Identifier for messages sent by this MCP server
      messageHistoryLimit: 100, // Store last 100 messages in client memory
    })

    /**
     * Handle successful connection to chat room.
     * This event is emitted when the WebSocket connection is established
     * and the room join is confirmed.
     */
    this.client.on("connected", () => {
      this.isConnected = true
      console.error(`Successfully connected to chat room for ${this.token}`)
    })

    /**
     * Handle new incoming messages.
     * These are real-time messages posted by users in the chat.
     */
    this.client.on("message", (message) => {
      // Add to our local buffer
      this.messageBuffer.push(message)
      
      // Prevent buffer from growing indefinitely
      // Keep only the last 1000 messages
      if (this.messageBuffer.length > 1000) {
        this.messageBuffer.shift() // Remove oldest message
      }
      
      // Log the message for debugging
      console.error(`New message from ${message.username}: ${message.message}`)
    })

    /**
     * Handle message history received from server.
     * This typically happens right after joining the room.
     */
    this.client.on("messageHistory", (messages) => {
      console.error(`Received ${messages.length} historical messages`)
    })

    /**
     * Handle connection errors.
     * These could be network issues, protocol errors, etc.
     */
    this.client.on("error", (error) => {
      console.error(`Chat error:`, error)
    })

    /**
     * Handle server-side errors.
     * These are typically application-level errors like authentication failures.
     */
    this.client.on("serverError", (error) => {
      console.error(`Server error:`, error)
      
      // Provide helpful information for authentication errors
      if (error.error === "Authentication required") {
        console.error(`Note: Sending messages requires authentication with pump.fun`)
      }
    })

    /**
     * Handle disconnection from chat room.
     * The client will automatically attempt to reconnect.
     */
    this.client.on("disconnected", () => {
      this.isConnected = false
      console.error(`Disconnected from chat room`)
    })

    // Initiate the connection
    this.client.connect()
  }

  /**
   * Sets up MCP protocol handlers for tool discovery and execution.
   * This defines what tools are available and how to handle tool calls.
   * @private
   */
  private setupHandlers() {
    /**
     * Handle ListTools requests.
     * This tells the AI assistant what tools are available and their schemas.
     */
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          // Tool for reading chat messages
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
          // Tool for getting just the latest message
          name: "PumpFunChat_GetLatestMessage",
          description: `Get the most recent message from the pump.fun chat room for token ${this.token}`,
          inputSchema: {
            type: "object",
            properties: {}, // No parameters needed
          },
        },
        {
          // Tool for sending messages (requires auth)
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
            required: ["message"], // Message is required
          },
        },
        {
          // Tool for checking connection status
          name: "PumpFunChat_GetStatus",
          description: "Get the connection status and token information",
          inputSchema: {
            type: "object",
            properties: {}, // No parameters needed
          },
        },
      ],
    }))

    /**
     * Handle CallTool requests.
     * This routes tool calls to the appropriate handler methods.
     */
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      // Route based on tool name
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
          // Unknown tool name - this shouldn't happen if the client is well-behaved
          throw new Error(`Unknown tool: ${request.params.name}`)
      }
    })
  }

  /**
   * Handles the ReadMessages tool call.
   * Retrieves messages from the chat room with optional limit.
   * @param {ReadMessagesArgs} args - Tool arguments
   * @returns {Promise<Object>} MCP response with message content
   * @private
   */
  private async handleReadMessages(args: ReadMessagesArgs) {
    // Check if we're connected
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

    // Get messages from the client (respects the limit if provided)
    const messages = this.client.getMessages(args.limit)
    
    // Handle empty message list
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

    // Format messages for display
    // Convert each message to a readable format with timestamp, username, and content
    const formattedMessages = messages.map(msg => 
      `[${new Date(msg.timestamp).toLocaleTimeString()}] ${msg.username}: ${msg.message}`
    ).join("\n")

    // Return formatted messages
    return {
      content: [
        {
          type: "text",
          text: `Messages from ${this.token} (showing ${messages.length} messages):\n\n${formattedMessages}`,
        },
      ],
    }
  }

  /**
   * Handles the GetLatestMessage tool call.
   * Retrieves only the most recent message from the chat.
   * @returns {Promise<Object>} MCP response with the latest message
   * @private
   */
  private async handleGetLatestMessage() {
    // Check connection status
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

    // Get the latest message
    const latestMessage = this.client.getLatestMessage()
    
    // Handle case where no messages exist
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

    // Return formatted latest message
    return {
      content: [
        {
          type: "text",
          text: `Latest message:\n[${new Date(latestMessage.timestamp).toLocaleTimeString()}] ${latestMessage.username}: ${latestMessage.message}`,
        },
      ],
    }
  }

  /**
   * Handles the SendMessage tool call.
   * Attempts to send a message to the chat room.
   * Note: This requires authentication with pump.fun to work.
   * @param {SendMessageArgs} args - Tool arguments containing the message
   * @returns {Promise<Object>} MCP response confirming the send attempt
   * @private
   */
  private async handleSendMessage(args: SendMessageArgs) {
    // Check connection status
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

    // Attempt to send the message
    // Note: This will fail without proper authentication
    this.client.sendMessage(args.message)

    // Return confirmation with authentication note
    return {
      content: [
        {
          type: "text",
          text: `Message sent: "${args.message}"\nNote: Messages require pump.fun authentication to be delivered.`,
        },
      ],
    }
  }

  /**
   * Handles the GetStatus tool call.
   * Provides information about the current connection and token.
   * @returns {Promise<Object>} MCP response with status information
   * @private
   */
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

  /**
   * Starts the MCP server and begins listening for requests.
   * Uses stdio transport for communication with the AI assistant.
   * @returns {Promise<void>}
   * @public
   */
  async run() {
    // Create stdio transport for MCP communication
    // This uses standard input/output for protocol messages
    const transport = new StdioServerTransport()
    
    // Connect the server to the transport
    await this.server.connect(transport)
    
    // Log that we're running (to stderr to avoid protocol interference)
    console.error(`Pump.fun Chat MCP server running for token: ${this.token}`)
  }
}

/**
 * Main entry point for the MCP server.
 * Validates environment variables and starts the server.
 */

// Get token from environment variable
// This is the preferred method for MCP servers to receive configuration
const token = process.env.PUMP_FUN_TOKEN

// Validate that token was provided
if (!token) {
  console.error("Error: PUMP_FUN_TOKEN environment variable is required")
  console.error("Example: PUMP_FUN_TOKEN=y31hFyYbrVW4R53Zfka8WJfQpwpMLfCcAjVKAonpump pump-fun-chat-mcp")
  process.exit(1)
}

// Create and start the server
const server = new PumpFunChatServer(token)

// Run the server and handle any startup errors
server.run().catch((error) => {
  console.error("Failed to start MCP server:", error)
  process.exit(1)
})