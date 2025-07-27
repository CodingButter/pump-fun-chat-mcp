# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server for pump.fun chat integration. It allows AI assistants like Claude to connect to and interact with pump.fun token chat rooms through standardized MCP tools.

## Development Commands

- `npm run build` - Compile TypeScript to JavaScript in dist/
- `npm run dev` - Run the example client with hot-reload (nodemon watching src/)
- `npm run start` - Run the compiled example client
- `npm run mcp` - Run the MCP server in development mode (ts-node)
- `npm run mcp:build` - Build and run the MCP server

## Architecture

### Core Components

1. **PumpChatClient** (`src/pump-chat-client.ts`)
   - WebSocket client handling socket.io protocol for pump.fun
   - Manages connection lifecycle with automatic reconnection
   - Maintains message history buffer
   - Event-driven architecture extending EventEmitter
   - Handles socket.io specific message types (0, 40, 42, 43, 2/3 ping/pong)

2. **MCP Server** (`src/mcp-server.ts`)
   - Main entry point for the MCP server (has shebang `#!/usr/bin/env node`)
   - Requires token via environment variable `PUMP_FUN_TOKEN` or command line argument
   - Exposes 4 MCP tools: ReadMessages, GetLatestMessage, SendMessage, GetStatus
   - Uses StdioServerTransport for Claude Code communication

3. **Example Client** (`src/index.ts`)
   - Standalone example demonstrating PumpChatClient usage
   - Not part of the MCP server distribution

### Message Flow

1. MCP Server receives tool calls from Claude Code via stdio
2. Server translates these to PumpChatClient method calls
3. PumpChatClient manages WebSocket connection to pump.fun servers
4. Messages are buffered in memory with configurable history limit
5. Responses are formatted and returned through MCP protocol

### Key Implementation Details

- WebSocket URL: `wss://ny.pump.fun/socket.io/?EIO=3&transport=websocket`
- Uses socket.io protocol requiring specific handshake and message format
- Messages are JSON arrays wrapped in socket.io protocol frames
- Authentication happens through cookie header in WebSocket upgrade request
- Each server instance is dedicated to a single token/room

## Publishing & Distribution

The package is published to npm as `pump-fun-chat-mcp`. The bin field in package.json registers the global command pointing to `dist/mcp-server.js`.

Files included in npm package:
- dist/mcp-server.js (and .map)
- dist/pump-chat-client.js (and .map)
- README.md
- LICENSE

## TypeScript Configuration

- Target: ES2016
- Module: CommonJS
- Strict mode enabled
- Source maps generated
- Output directory: ./dist
- Root directory: ./src