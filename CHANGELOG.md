# Changelog

All notable changes to this project will be documented in this file.

## [2.1.1] - 2025-07-27

### Added

- Comprehensive JSDoc documentation for all classes, methods, and interfaces
- Detailed inline implementation comments explaining code logic
- Enhanced documentation for MCP tools and their parameters
- Improved example file with extensive documentation

### Dependencies

- Updated dependency pump-chat-client to v1.0.1 with enhanced documentation

## [2.1.0] - 2025-07-27

### Changed

- Decoupled pump-chat-client into a separate npm package
- Now uses pump-chat-client as a dependency instead of bundling it
- Removed pump-chat-client source files from the distribution
- Dependency on pump-chat-client npm package (v1.0.0)

## [2.0.4] - 2025-07-27

### Changed

- Updated WebSocket headers to match browser request exactly
- Added all required headers including Host, Connection, Upgrade, User-Agent, Accept-Encoding
- Improved protocol compliance for better connection stability

## [2.0.3] - 2025-07-27

### Added

- Implemented socket.io acknowledgment ID tracking system
- Added support for numbered acknowledgment responses (430-439)
- Added pending acknowledgment map to track request/response pairs
- Added automatic cleanup of stale acknowledgments

### Changed

- Updated joinRoom, getMessageHistory, and sendMessage to use incrementing acknowledgment IDs
- Refactored message handlers to properly route responses based on acknowledgment IDs
- Enhanced protocol compliance with socket.io specification
- Fixed acknowledgment matching for reliable request/response correlation
- Improved handling of socket.io protocol messages

## [2.0.2] - 2025-07-27

### Fixed

- Added username field to sendMessage payload to match pump.fun protocol
- Added handling for "438" error acknowledgment messages
- Added serverError event emission for proper error handling

### Updates

- Updated sendMessage to include authentication requirement notice
- Enhanced error logging to show when authentication is needed

### Known Limitations

- Sending messages requires pump.fun authentication (login cookies)
- Read-only access works without authentication

## [2.0.1] - 2025-07-27

### Fixed

- Fixed message history retrieval by adding support for socket.io message type "431"
- Fixed message parsing to handle both "43" and "431" acknowledgment message types
- Added immediate message history request after joining room to ensure messages are loaded
- Improved connection stability and message buffering

### Improvements

- Enhanced error handling for WebSocket message parsing
- Updated message acknowledgment parsing to be more robust

## [2.0.0] - Previous Release

### Added

- Initial MCP server implementation
- WebSocket connection to pump.fun chat rooms
- Support for reading messages, sending messages, and getting status
- Automatic reconnection with exponential backoff
- Message history buffering with configurable limits
