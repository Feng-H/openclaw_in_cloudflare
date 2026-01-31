
export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    chat: {
      id: number;
      type: string;
    };
    text?: string;
    from?: {
      id: number;
      is_bot: boolean;
      first_name: string;
    };
  };
}

export async function sendMessage(chatId: number, text: string, token: string): Promise<void> {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown', // 或 'HTML'
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Telegram API Error: ${response.status} ${response.statusText}`, errorText);
    throw new Error(`Failed to send Telegram message: ${errorText}`);
  }
}
