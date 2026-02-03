# OpenCode Multi-Notification Plugin

OpenCode plugin that sends notifications to Discord and/or WhatsApp when AI sessions complete or require permission.

## Features

- **Multi-provider support**: Send to Discord, WhatsApp, or both simultaneously
- **Rich Discord embeds**: Color-coded notifications with detailed session info
- **Error isolation**: If one provider fails, others still succeed
- **Flexible configuration**: Enable/disable providers individually

## Installation

```bash
cd ~/.config/opencode/plugins
git clone https://github.com/your-repo/opencode-multi-notification
cp opencode-multi-notification/src/example.config.json opencode-multi-notification/config.json
```

## Configuration

### Creating Your Config

1. Copy example configuration:
```bash
cp src/example.config.json config.json
```

2. Edit `config.json` with your actual values:
   - Replace Discord webhook URL
   - Replace WhatsApp instance ID and API token
   - Replace phone number

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

These colors provide visual distinction in Discord - green for successful completion, orange for attention-required permission requests.

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

## Troubleshooting

### Discord not receiving notifications

- Verify webhook URL is correct and valid
- Check webhook is active in Discord server settings
- Ensure bot has permissions to send webhooks to the channel

### WhatsApp not receiving notifications

- Verify instance ID and API token are correct
- Check your phone number is saved as a contact in Green-API
- Ensure chat ID format is `NUMBER@c.us` (example: `15551234567@c.us`)

### Multiple providers failing

- Check OpenCode logs for specific error messages
- Verify each provider's configuration is valid
