export interface FeishuEvent {
  schema?: string;
  header: {
    event_id: string;
    token: string;
    create_time: string;
    event_type: string;
    tenant_key: string;
    app_id: string;
  };
  event?: {
    sender?: {
      sender_id?: {
        open_id?: string;
        user_id?: string;
        union_id?: string;
        email?: string;
      };
      sender_type?: string;
      tenant_key?: string;
    };
    message?: {
      message_id: string;
      root_id?: string;
      parent_id?: string;
      create_time: string;
      chat_id: string;
      chat_type: string;
      message_type: string;
      content: string; // JSON string
      mentions?: any[];
    };
  };
  challenge?: string; // For url_verification
  type?: string; // For url_verification
  token?: string; // For url_verification
}

/**
 * 获取 Tenant Access Token
 */
async function getTenantAccessToken(appId: string, appSecret: string): Promise<string> {
  const url = 'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: appId,
      app_secret: appSecret
    })
  });

  if (!res.ok) {
    throw new Error(`Failed to get Feishu token: ${res.statusText}`);
  }

  const data = await res.json() as { code: number; msg: string; tenant_access_token: string; expire: number };
  if (data.code !== 0) {
    throw new Error(`Feishu Auth Error: ${data.msg}`);
  }

  return data.tenant_access_token;
}

/**
 * 发送飞书消息
 */
export async function sendFeishuMessage(
  receiveId: string,
  text: string,
  appId: string,
  appSecret: string,
  receiveIdType: 'open_id' | 'chat_id' | 'email' | 'user_id' | 'union_id' = 'open_id'
): Promise<void> {
  const accessToken = await getTenantAccessToken(appId, appSecret);
  const url = `https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=${receiveIdType}`;

  // Feishu text content needs to be JSON stringified object: { "text": "content" }
  const contentObj = { text: text };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      receive_id: receiveId,
      msg_type: 'text',
      content: JSON.stringify(contentObj)
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Feishu Send Error:', errorText);
  } else {
    const data = await res.json() as any;
    if (data.code !== 0) {
        console.error('Feishu Send API Error:', data);
    }
  }
}
