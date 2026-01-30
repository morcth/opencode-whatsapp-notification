# opencode-whatsapp-notification

OpenCode plugin that sends WhatsApp notifications on session completion and permission requests using Green-API.

## Features

- Completion Notifications: Get a WhatsApp message when OpenCode finishes a long task.
- Context Stats: Includes peak turn context usage percentage and token counts.
- Model Info: Shows which model was used for the response.
- Permission Alerts: Real-time notifications when OpenCode is blocked waiting for terminal permissions, including the command it's trying to run.
- Provider Abstraction: Easy to add new notification channels (Discord, Slack, etc.) in future.

## Installation

Clone locally:

```bash
git clone <repo-url>
cd opencode-whatsapp-notification
```

Drop plugin files in `.opencode/plugin/`:

```bash
# For project-level plugins
mkdir -p .opencode/plugin/opencode-whatsapp-notification
cp -r src/* .opencode/plugin/opencode-whatsapp-notification/

# OR for global plugins
mkdir -p ~/.config/opencode/plugin/opencode-whatsapp-notification
cp -r src/* ~/.config/opencode/plugin/opencode-whatsapp-notification/
```

OpenCode loads all TypeScript files from `.opencode/plugin/` directory.

## Configuration

After installing the plugin, copy `example.config.json` to `config.json` in the plugin directory and fill in your Green-API credentials:

```bash
# For project-level plugins
cd .opencode/plugin/opencode-whatsapp-notification
cp example.config.json config.json
# Edit config.json with your credentials

# OR for global plugins
cd ~/.config/opencode/plugin/opencode-whatsapp-notification
cp example.config.json config.json
# Edit config.json with your credentials
```

```json
{
  "provider": "whatsapp-greenapi",
  "enabled": true,
  "apiUrl": "https://api.green-api.com",
  "instanceId": "YOUR_INSTANCE_ID",
  "apiToken": "YOUR_API_TOKEN",
  "chatId": "YOUR_PHONE_NUMBER@c.us",
  "timeout": 10000
}
```

### Configuration Fields

- `provider`: Must be "whatsapp-greenapi"
- `enabled`: Set to `false` to disable notifications
- `apiUrl`: Green-API base URL (usually `https://api.green-api.com`)
- `instanceId`: Your Green-API instance ID
- `apiToken`: Your Green-API API token
- `chatId`: Your phone number in WhatsApp format (e.g., `11001100110@c.us`)
- `timeout`: Optional HTTP timeout in milliseconds (default: 10000)

Get your Green-API credentials from https://green-api.com.

## Development

1. Clone the repo.
2. Install dependencies: `bun install`.
3. Type-check: `bun x tsc`.
4. Run tests: `bun test`.

## License

MIT
