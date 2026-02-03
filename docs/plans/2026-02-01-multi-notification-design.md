# OpenCode Multi-Notification Plugin Design

**Date**: 2026-02-01
**Project**: opencode-multi-notification
**Status**: Ready for Implementation

## Overview

Transition from WhatsApp-only to multi-provider notification system supporting Discord (primary) and WhatsApp simultaneously. Users can enable one or both providers. Discord uses rich embeds with colors and structured fields; WhatsApp uses text messages.

## Architecture

### File Structure

```
src/
├── index.ts (refactored)
├── dispatcher.ts (new)
├── config/
│   └── loader.ts (refactored)
├── providers/
│   ├── registry.ts (refactored)
│   ├── whatsapp-greenapi.ts (minimal changes)
│   └── discord.ts (new)
├── payload/
│   └── builders.ts (unchanged)
├── types/
│   ├── notifier.ts (update DiscordConfig)
│   └── errors.ts (unchanged)
└── example.config.json (new structure)
```

### Core Components

1. **Provider Interface** (`src/types/notifier.ts`)
   - `NotifierProvider` interface with `name` property and `send()` method
   - All providers implement same interface for consistency

2. **Discord Provider** (`src/providers/discord.ts`)
    - Discord webhook notifications with embeds
    - Uses `fetch` for webhook POST requests (no additional dependencies)
    - Color-coded: green (0x00ff00) for session.idle, orange (0xffa500) for permission.asked
    - Fields: context usage, total tokens, model name
    - Footer with session ID

3. **WhatsApp Provider** (`src/providers/whatsapp-greenapi.ts`)
   - Existing WhatsApp Green-API provider, no functional changes
   - Text-only messages

4. **Provider Registry** (`src/providers/registry.ts`)
   - `getProviders()` method returns array of enabled provider instances
   - Iterates through `config.providers` nested object
   - Skips providers with `enabled: false`
   - Throws `ProviderError` for unknown provider types

5. **Notification Dispatcher** (`src/dispatcher.ts`)
    - Separate module for clean separation of concerns
    - `dispatchNotification()` calls all enabled providers in parallel
    - Uses `Promise.allSettled()` for error isolation
    - Logs per-provider results (SUCCESS/FAILED with reason)
    - Never throws, continues to next provider on failure

6. **Config Loader** (`src/config/loader.ts`)
    - Reads plugin config from `config.json` only (no opencode.json fallback)
    - Validates config structure before creating providers
    - Throws `ConfigError` for invalid configurations
    - No `fallbackConfigPath` field (removed for cleaner design)

### Configuration Structure

```json
{
  "enabled": true,
  "providers": {
    "discord": {
      "enabled": true,
      "webhookUrl": "https://discord.com/api/webhooks/...",
      "username": "OpenCode Notifier",
      "avatarUrl": "https://..."
    },
    "whatsapp-greenapi": {
      "enabled": true,
      "apiUrl": "https://api.green-api.com",
      "instanceId": "YOUR_INSTANCE_ID",
      "apiToken": "YOUR_API_TOKEN",
      "chatId": "YOUR_PHONE_NUMBER@c.us",
      "timeout": 10000
    }
  }
}
```

## Data Flow

1. Event received → Plugin `event()` handler
2. Extract sessionId → Wait 1.5s (idle events only)
3. Fetch session + messages → Build notification payload
4. ConfigLoader reads config → ProviderRegistry creates provider instances
5. Dispatcher calls `Promise.allSettled()` with all enabled providers
6. Each provider's `send()` executes → Discord webhook POST, WhatsApp Green-API request
7. Dispatcher logs results → Per-provider success/failure logging

## Error Handling

### Multi-Layered Strategy

**Config Level**:
- Invalid JSON → `ConfigError` with details
- Missing required fields → Clear error message
- Unknown provider → `ProviderError` listing valid types
- Plugin disabled → Early return, no processing
- All providers disabled → Log info message, no processing

**Provider Level**:
- Network errors → Logged, doesn't block other providers
- Invalid responses → Warning logged, continue
- Timeout errors → Provider timeout setting (default 10s)

**Dispatcher Level**:
- `Promise.allSettled()` ensures all providers attempted
- Never throws from dispatcher (error isolation)
- Logs results: `[Multi-Notifier] Discord: SUCCESS`, `[Multi-Notifier] WhatsApp: FAILED - Connection timeout`

**Event Handler Level**:
- Catch-all for unexpected errors
- Logs to OpenCode `client.app.log()` with service 'multi-notifier'
- Never crashes plugin

### Error Types

- `ConfigError`: Invalid configuration structure
- `ProviderError`: Unknown provider type
- `NotificationError` (optional): Send failure details

## Testing Strategy

### Unit Tests

- ConfigLoader validation (valid/invalid/missing configs)
- ProviderRegistry provider creation from config
- Discord provider webhook formatting (embed structure, colors)
- WhatsApp provider message formatting
- Provider config validation

### Integration Tests

- Dispatcher sends to multiple mock providers
- Error isolation (one fails, others succeed)
- Disabled providers skipped
- Parallel execution order

### Test Scenarios

1. Discord only enabled
2. WhatsApp only enabled
3. Both providers enabled
4. All providers disabled → log info message, no notifications
5. Discord fails, WhatsApp succeeds
6. Invalid config → plugin logs error, returns empty event handler
7. Partial provider config (e.g., Discord enabled but missing webhookUrl) → `ConfigError`

### Test Doubles

- Mock providers tracking `send()` calls
- Mock fetch for webhook tests
- Config fixtures (multi-provider, single-provider, invalid)

## Implementation Notes

- Plugin rename: `opencode-whatsapp-notification` → `opencode-multi-notification`
- Keep existing `payload/builders.ts` payload structure
- Providers receive same `NotificationPayload`, format for their platform
- Use `bun test` for testing
- Provider timeout defaults to 10s (WhatsApp)
- Discord has no timeout (fast webhook)
- Maintain existing test structure in `tests/` directory

## Success Criteria

- ✅ Plugin renamed to `opencode-multi-notification`
- ✅ Multi-provider notifications working (Discord + WhatsApp simultaneously)
- ✅ Discord uses rich embeds with colors matching original plugin
- ✅ Error isolation (one provider failure doesn't block others)
- ✅ Config validation catches invalid configurations early
- ✅ All tests pass
- ✅ Documentation updated (README, example.config.json, package.json)
