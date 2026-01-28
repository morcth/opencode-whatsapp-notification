import type { Plugin } from "@opencode-ai/plugin";

interface DiscordWebhookConfig {
  webhookUrl?: string;
  enabled?: boolean;
  username?: string;
  avatarUrl?: string;
}

export const DiscordNotificationPlugin: Plugin = async ({ client, project }) => {
  return {
    event: async ({ event }) => {
      // 1. Handle Session Completed (Green)
      if (event.type === "session.idle") {
        await handleNotification(client, project, event, "idle");
      }
      // 2. Handle Permission Request (Orange)
      else if (event.type === "permission.asked") {
        await handleNotification(client, project, event, "permission");
      }
    },
  };
};

async function handleNotification(client: any, project: any, event: any, type: "idle" | "permission") {
  try {
    // 1. GET CONFIGURATION
    // Priority 1: project.config (opencode.json)
    // Priority 2: Local file (for development or if schema is strict)
    let config: DiscordWebhookConfig = project.config?.discordNotifications || {};

    if (!config.webhookUrl) {
      try {
        const configPath = "/var/home/frieser/.config/opencode/discord-notification-config.json";
        const configFile = Bun.file(configPath);
        if (await configFile.exists()) {
          config = await configFile.json();
        }
      } catch (e) {}
    }

    if (!config.enabled || !config.webhookUrl) return;

    const sessionId = event.properties?.sessionID || event.properties?.id || event.properties?.sessionId;
    if (!sessionId) return;

    // Only wait on idle to give tokens time to settle
    if (type === "idle") {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    const [sRes, mRes] = await Promise.all([
      client.session.get({ path: { id: sessionId } }),
      client.session.messages({ path: { id: sessionId } })
    ]);
    
    const session = (sRes as any).data || sRes;
    const messages = (mRes as any).data || mRes || [];

    let lastText = "Response completed.";
    let contextUsage = "N/A";
    let modelName = session?.model?.name || "Unknown";
    let totalTokensAccumulated = 0;
    let pendingCommand = "";

    // Analyze messages
    messages.forEach((m: any) => {
      const isAssistant = (m.info?.role || m.role) === "assistant";
      if (isAssistant) {
        const t = m.info?.tokens || m.tokens;
        if (t) {
          const turnTotal = (t.input || 0) + (t.output || 0) + (t.cache?.read || 0);
          totalTokensAccumulated = Math.max(totalTokensAccumulated, turnTotal);
        }
        if (type === "permission" && m.parts) {
          const toolPart = m.parts.find((p: any) => p.type === "tool" && (p.state?.status === "pending" || p.state?.status === "running"));
          if (toolPart) {
            const input = toolPart.state?.input || {};
            pendingCommand = input.command || input.filePath || JSON.stringify(input);
          }
        }
      }
    });

    if (totalTokensAccumulated > 0 && session?.model?.limit?.context) {
      const percentage = ((totalTokensAccumulated / session.model.limit.context) * 100).toFixed(2);
      contextUsage = `${percentage}%`;
    }

    const assistantMessages = messages.filter((m: any) => (m.info?.role || m.role) === "assistant");
    const lastAssistant = assistantMessages[assistantMessages.length - 1];
    if (lastAssistant) {
      const text = lastAssistant.parts?.filter((p: any) => p.type === "text").map((p: any) => p.text).join("\n");
      if (text) lastText = text;
      modelName = (lastAssistant.info?.modelID || lastAssistant.modelID) || modelName;
    }

    const isPermission = type === "permission";
    const title = isPermission ? "⚠️ Permission Required" : "✅ Response Completed";
    const color = isPermission ? 0xffa500 : 0x00ff00;
    
    let description = lastText;
    const fields = [
      { name: "📊 Context Usage", value: contextUsage, inline: true },
      { name: "🔢 Total Tokens", value: `${totalTokensAccumulated.toLocaleString()} tokens`, inline: true },
      { name: "🤖 Model", value: modelName, inline: true }
    ];

    if (isPermission) {
      fields.unshift({ 
        name: "🔒 Blocked Command / Action", 
        value: `\`\`\`bash\n${pendingCommand || "Check terminal for details"}\n\`\`\``, 
        inline: false 
      });
      description = "OpenCode has paused execution and is waiting for you to authorize the operation shown above.";
    }

    await fetch(config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: config.username || "OpenCode Notifier",
        avatar_url: config.avatarUrl,
        embeds: [{
          title,
          description: description.length > 1500 ? description.substring(0, 1497) + "..." : description,
          color,
          fields,
          footer: { text: `Session ID: ${sessionId}` },
          timestamp: new Date().toISOString()
        }]
      }),
    });
  } catch (e) {
    console.error("Discord Plugin Error:", e);
  }
}

export default DiscordNotificationPlugin;
