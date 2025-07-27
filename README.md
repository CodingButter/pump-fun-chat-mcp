# pump-fun-chat-mcp

A Model Context Protocol (MCP) server for connecting to and reading messages from pump.fun chat rooms. This package allows AI assistants like Claude to interact with pump.fun token chat rooms through a standardized interface.

This package uses [pump-chat-client](https://www.npmjs.com/package/pump-chat-client) for WebSocket communication with pump.fun.

## Features

- 🔌 Connect to a specific pump.fun token chat room
- 📨 Read chat messages with configurable history limits
- 💬 Send messages to the chat (if authenticated)
- 🔄 Automatic reconnection with exponential backoff
- 📊 Real-time message streaming
- 🛠️ Easy integration with Claude Code and other MCP-compatible clients

## Installation

### Global Installation (Recommended)

```bash
npm install -g pump-fun-chat-mcp
```

### Local Installation

```bash
npm install pump-fun-chat-mcp
```

## Usage

The MCP server requires a token address as a command-line argument:

```bash
pump-fun-chat-mcp <token-address>
```

Example:
```bash
pump-fun-chat-mcp y31hFyYbrVW4R53Zfka8WJfQpwpMLfCcAjVKAonpump
```

## Adding to Claude Code

Add the following to your Claude Code MCP settings file (usually `~/.config/claude/mcp.json` or `%APPDATA%\claude\mcp.json` on Windows):

```json
{
  "mcpServers": {
    "pump-fun-chat": {
      "command": "npx",
      "args": ["pump-fun-chat-mcp", "YOUR_TOKEN_ADDRESS_HERE"]
    }
  }
}
```

If you installed globally:

```json
{
  "mcpServers": {
    "pump-fun-chat": {
      "command": "pump-fun-chat-mcp",
      "args": ["YOUR_TOKEN_ADDRESS_HERE"]
    }
  }
}
```

### Multiple Token Configuration

To monitor multiple tokens, add separate server entries:

```json
{
  "mcpServers": {
    "pump-chat-token1": {
      "command": "pump-fun-chat-mcp",
      "args": ["TOKEN_ADDRESS_1"]
    },
    "pump-chat-token2": {
      "command": "pump-fun-chat-mcp",
      "args": ["TOKEN_ADDRESS_2"]
    }
  }
}
```

## Available MCP Tools

### PumpFunChat_ReadMessages
Read messages from the connected pump.fun chat room.

Parameters:
- `limit` (optional): Maximum number of messages to retrieve

### PumpFunChat_GetLatestMessage
Get the most recent message from the chat room.

No parameters required.

### PumpFunChat_SendMessage
Send a message to the chat room.

Parameters:
- `message` (required): The message text to send

### PumpFunChat_GetStatus
Get the connection status and token information.

No parameters required.

## Usage Examples

Once configured in Claude Code, you can use commands like:

1. "Read the last 20 messages from the pump.fun chat"
2. "What's the latest message in the chat?"
3. "Send a message saying 'Hello everyone!'"
4. "Check the connection status"

## Development

### Running from Source

```bash
# Clone the repository
git clone https://github.com/codingbutter/pump-fun-chat-mcp.git
cd pump-fun-chat-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Run the MCP server with a token
npm run mcp -- YOUR_TOKEN_ADDRESS
```

### Running the Example Client

```bash
npm run dev
```

## Technical Details

- Uses socket.io protocol for WebSocket communication
- Implements proper message type handling (0, 40, 42, 43, 2/3 for ping/pong)
- Maintains message history with configurable limits
- Event-driven architecture for real-time updates
- Each server instance is dedicated to a single token/room

## Command Line Arguments

- `<token-address>` (required): The pump.fun token address to connect to

## Environment Variables

None required. All configuration is done through command-line arguments.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and feature requests, please visit the [GitHub repository](https://github.com/codingbutter/pump-fun-chat-mcp/issues).