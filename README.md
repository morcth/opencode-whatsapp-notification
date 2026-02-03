# OpenCode Multi-Notification Plugin

OpenCode plugin that sends notifications to Discord and/or WhatsApp when AI sessions complete or require permission.

## Features

- **Multi-provider support**: Send to Discord, WhatsApp, or both simultaneously
- **Rich Discord embeds**: Color-coded notifications with detailed session info
- **Error isolation**: If one provider fails, others still succeed
- **Flexible configuration**: Enable/disable providers individually

## Installation

1. Copy this plugin to your OpenCode plugins directory
2. Create `config.json` in plugin directory

## Configuration

### Example Configuration

```json
{
  "enabled": true,
  "providers": {
    "discord": {
      "enabled": true,
      "webhookUrl": "https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN",
      "username": "OpenCode Notifier",
      "avatarUrl": "https://example.com/your-avatar.png"
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

### Provider Settings

#### Discord

- `enabled`: Enable/disable Discord notifications (default: true)
- `webhookUrl`: Your Discord webhook URL (required)
- `username`: Custom bot username (optional)
- `avatarUrl`: Custom bot avatar URL (optional)

#### WhatsApp (Green-API)

- `enabled`: Enable/disable WhatsApp notifications (default: true)
- `apiUrl`: Green-API base URL (default: https://api.green-api.com)
- `instanceId`: Your Green-API instance ID (required)
- `apiToken`: Your Green-API API token (required)
- `chatId`: Target phone number in format `NUMBER@c.us` (required)
- `timeout`: Request timeout in milliseconds (default: 10000)

### Setting Up Discord Webhooks

1. Go to your Discord server settings
2. Navigate to Integrations → Webhooks
3. Create new webhook
4. Copy webhook URL to your config

### Setting Up WhatsApp (Green-API)

1. Register at [green-api.com](https://green-api.com)
2. Create an instance
3. Get your instance ID and API token
4. Add your phone number to contacts
5. Update config with your credentials

## Notification Events

### Session Idle

Sent when an AI session completes. Includes:
- Session ID and timestamp
- Project name
- Peak tokens and context usage
- Model name
- Last message preview
- **Discord**: Green embed (0x00ff00)

### Permission Asked

Sent when AI needs user permission for an action. Includes all session data plus:
- Pending command
- **Discord**: Orange embed (0xffa500)

## Testing

```bash
bun test
```

## Development

```bash
bun run typecheck  # Type checking
bun test           # Run tests
```
