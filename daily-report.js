/**
 * AI每日日报 - 飞书文档版
 * 每天自动生成AI日报并推送到飞书
 * 
 * 配置项（通过环境变量或配置文件）:
 * - FEISHU_APP_ID: 飞书应用ID
 * - FEISHU_APP_SECRET: 飞书应用密钥  
 * - FEISHU_USER_ID: 接收日报的用户ID（可选，用于DM推送）
 * - FEISHU_FOLDER_TOKEN: 文档存储的文件夹token（可选）
 */

const FEISHU_APP_ID = process.env.FEISHU_APP_ID || 'cli_a922fb50b5f8dcbb';
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET || 'xxxxx';
const FEISHU_USER_ID = process.env.FEISHU_USER_ID || 'ou_22ff2d1e6984e23d74a8a2a8ccc9c831';
const FEISHU_CHAT_ID = process.env.FEISHU_CHAT_ID || '';  // 群聊ID，置空则只发送到私聊
const FEISHU_FOLDER_TOKEN = process.env.FEISHU_FOLDER_TOKEN || '';

// 飞书API基础URL
const FEISHU_BASE_URL = 'https://open.feishu.cn/open-apis';

/**
 * 获取飞书应用Access Token
 */
async function getAppAccessToken() {
  const response = await fetch(`${FEISHU_BASE_URL}/auth/v3/app_access_token/internal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      app_id: FEISHU_APP_ID,
      app_secret: FEISHU_APP_SECRET,
    }),
  });

  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(`获取Access Token失败: ${JSON.stringify(data)}`);
  }
  return data.app_access_token;
}

/**
 * 获取用户Access Token（用于发送消息）
 */
async function getUserAccessToken() {
  const response = await fetch(`${FEISHU_BASE_URL}/authen/v1/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code: process.env.FEISHU_AUTH_CODE || '',
    }),
  });

  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(`获取User Access Token失败: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

/**
 * 创建飞书文档
 */
async function createDocument(token, title, content) {
  const response = await fetch(`${FEISHU_BASE_URL}/docx/v1/documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      document: {
        title: title,
        parent_node_token: FEISHU_FOLDER_TOKEN || undefined,
      },
    }),
  });

  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(`创建文档失败: ${JSON.stringify(data)}`);
  }
  return data.data;
}

/**
 * 向文档中添加内容
 */
async function appendDocumentContent(token, documentId, blocks) {
  const response = await fetch(`${FEISHU_BASE_URL}/docx/v1/documents/${documentId}/append`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      document: {
        document_id: documentId,
      },
      blocks: blocks,
    }),
  });

  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(`添加内容失败: ${JSON.stringify(data)}`);
  }
  return data.data;
}

/**
 * 发送飞书消息（通过IM）
 */
async function sendMessage(token, userId, message) {
  const response = await fetch(`${FEISHU_BASE_URL}/im/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      receive_id: userId,
      msg_type: 'text',
      content: JSON.stringify({
        text: message,
      }),
    }),
  });

  const data = await response.json();
  if (data.code !== 0) {
    console.error(`发送消息失败: ${JSON.stringify(data)}`);
    return false;
  }
  return true;
}

/**
 * 发送富文本卡片消息
 */
async function sendRichMessage(token, userId, title, content, idType = 'open_id') {
  const card = {
    config: {
      wide_screen_mode: true,
    },
    header: {
      title: {
        tag: 'plain_text',
        content: title,
      },
      template: 'blue',
    },
    elements: [
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: content,
        },
      },
    ],
  };

  const response = await fetch(`${FEISHU_BASE_URL}/im/v1/messages?receive_id_type=${idType}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      receive_id: userId,
      msg_type: 'interactive',
      content: JSON.stringify(card),
    }),
  });

  const data = await response.json();
  if (data.code !== 0) {
    console.error(`发送卡片消息失败: ${JSON.stringify(data)}`);
    return false;
  }
  return true;
}

/**
 * 构建简单文本消息内容
 */
function buildSimpleMessage(content) {
  let msg = '';
  
  // 大模型动态
  msg += '**🧠 大模型动态**\n';
  content.modelUpdates.forEach(item => {
    msg += `▸ ${item.title}\n`;
    msg += `  主旨：${item.description}\n`;
    msg += `  来源：${item.source || '暂无'} · ${item.url || ''}\n\n`;
  });
  
  // 技术进展
  msg += '**⚡ 技术进展**\n';
  content.techProgress?.forEach(item => {
    msg += `▸ ${item.title}\n`;
    msg += `  主旨：${item.description}\n`;
    msg += `  来源：${item.source || '暂无'} · ${item.url || ''}\n\n`;
  });
  
  // 公司动向
  msg += '**🏢 公司动向**\n';
  content.companyNews?.forEach(item => {
    msg += `▸ ${item.title}\n`;
    msg += `  主旨：${item.description}\n`;
    msg += `  来源：${item.source || '暂无'} · ${item.url || ''}\n\n`;
  });
  
  // 产品发布
  msg += '**📦 产品发布**\n';
  content.productLaunch?.forEach(item => {
    msg += `▸ ${item.title}\n`;
    msg += `  主旨：${item.description}\n`;
    msg += `  来源：${item.source || '暂无'} · ${item.url || ''}\n\n`;
  });
  
  // 应用落地
  msg += '**🏥 应用落地**\n';
  content.aiApps.forEach(item => {
    msg += `▸ ${item.title}\n`;
    msg += `  主旨：${item.description}\n`;
    msg += `  来源：${item.source || '暂无'} · ${item.url || ''}\n\n`;
  });
  
  // 行业观察
  msg += '**📊 行业观察**\n';
  content.industryHot.forEach(item => {
    msg += `▸ ${item.title}\n`;
    msg += `  主旨：${item.description}\n`;
    msg += `  来源：${item.source || '暂无'} · ${item.url || ''}\n\n`;
  });
  
  return msg;
}

/**
 * 获取AI新闻内容（模拟数据，实际可接入API）
 */
async function fetchAIContent() {
  // 这里可以接入真实的AI新闻API
  // 目前返回模拟数据，实际使用时替换为真实数据源
  return {
    modelUpdates: [
      { title: 'Nvidia NemoClaw发布', description: 'Nvidia将在GTC大会上发布NemoClaw开源AI代理平台', source: 'NVIDIA', url: 'https://www.forbes.com/topics/enterprise-ai/' },
      { title: 'NVIDIA扩展Nemotron 3模型', description: '发布Nemotron 3 omni-understanding模型，为AI代理提供自然对话能力', source: 'NVIDIA', url: 'http://nvidianews.nvidia.com/news/nvidia-expands-open-model-families' },
      { title: '国产大模型再突破', description: '国产大模型性能接近GPT-4，推理效率大幅提升', source: '36氪', url: 'https://www.36kr.com' },
    ],
    techProgress: [
      { title: '新型注意力机制发布', description: 'MIT团队推出FlashAttention 3.0，推理速度提升3倍', source: 'TechCrunch', url: 'https://techcrunch.com' },
      { title: '国产AI芯片新进展', description: '国产芯片在能效比上实现突破，达到国际先进水平', source: '机器之心', url: 'https://www.jiqizhixin.com' },
    ],
    companyNews: [
      { title: 'Anthropic获Google投资', description: 'Anthropic获Google 20亿美元投资，估值突破600亿', source: 'Reuters', url: 'https://reuters.com' },
      { title: '字节跳动加码AI', description: '字节跳动宣布百亿级AI投资计划，重点布局大模型', source: '36氪', url: 'https://www.36kr.com' },
    ],
    productLaunch: [
      { title: 'Claude Desktop 3.0发布', description: '支持自主操作文件系统，标志AI助手向AI智能体演进', source: 'Anthropic', url: 'https://anthropic.com' },
      { title: '百度文心大模型4.0发布', description: '新增多模态理解能力，API价格大幅下降', source: '量子位', url: 'https://www.qbitai.com' },
    ],
    aiApps: [
      { title: 'SoundHound AI车载助手', description: '在Nvidia GTC推出Edge Agentic+汽车助手', source: 'Yahoo Finance', url: 'https://finance.yahoo.com/news/stock-market-today-march-16-224016933.html' },
      { title: 'AMD Helios AI平台', description: '与Celestica合作推出机架级AI平台', source: 'AMD', url: 'https://www.amd.com/en/newsroom/press-releases/2026-3-16-amd-and-celestica-announce-collaboration' },
      { title: 'AI医疗应用落地', description: '三甲医院引入AI辅助手术系统，已通过药监局审批', source: '36氪', url: 'https://www.36kr.com' },
    ],
    industryHot: [
      { title: 'Bill Gurley警告AI泡沫', description: '顶级风投警告AI行业存在泡沫，调整即将到来', source: 'CNBC', url: 'https://www.cnbc.com/2026/03/16/bill-gurley-ai-bubble-get-rich-quick.html' },
      { title: '2026年AI算力市场规模', description: '将突破5000亿美元，中国占比达28%', source: 'IDC', url: 'https://idc.com' },
      { title: '中国AI政策新动向', description: '国家出台AI发展专项规划，聚焦核心技术自主可控', source: '机器之心', url: 'https://www.jiqizhixin.com' },
    ],
    featured: [
      { title: 'AI Agent的未来', description: '探讨AI Agent在各行业的应用前景' },
    ],
  };
}

/**
 * 构建文档块
 */
function buildDocumentBlocks(content) {
  const blocks = [];

  // 大模型动态
  blocks.push({
    block_type: 2, // heading2
    heading2: {
      style: {},
      content: [{ tag: 'text', text: '🚀 大模型动态' }],
    },
  });

  content.modelUpdates.forEach(item => {
    blocks.push({
      block_type: 1, // paragraph
      paragraph: {
        style: {},
        elements: [
          { tag: 'text', text: '• ', text_decoration: { bold: true } },
          { tag: 'text', text: item.title, text_decoration: { bold: true } },
          { tag: 'text', text: '\n' },
          { tag: 'text', text: `   ${item.description}` },
        ],
      },
    });
  });

  // AI应用速递
  blocks.push({
    block_type: 2,
    heading2: {
      style: {},
      content: [{ tag: 'text', text: '⚡ AI应用速递' }],
    },
  });

  content.aiApps.forEach(item => {
    blocks.push({
      block_type: 1,
      paragraph: {
        style: {},
        elements: [
          { tag: 'text', text: '• ' },
          { tag: 'text', text: item.name, text_decoration: { bold: true } },
          { tag: 'text', text: '\n' },
          { tag: 'text', text: `   ${item.description}` },
        ],
      },
    });
  });

  // 行业热点
  blocks.push({
    block_type: 2,
    heading2: {
      style: {},
      content: [{ tag: 'text', text: '📊 行业热点' }],
    },
  });

  content.industryHot.forEach(item => {
    blocks.push({
      block_type: 1,
      paragraph: {
        style: {},
        elements: [
          { tag: 'text', text: '• ' },
          { tag: 'text', text: item.title, text_decoration: { bold: true } },
          { tag: 'text', text: '\n' },
          { tag: 'text', text: `   ${item.description}` },
        ],
      },
    });
  });

  // 今日精选
  blocks.push({
    block_type: 2,
    heading2: {
      style: {},
      content: [{ tag: 'text', text: '⭐ 今日精选' }],
    },
  });

  content.featured.forEach(item => {
    blocks.push({
      block_type: 1,
      paragraph: {
        style: {},
        elements: [
          { tag: 'text', text: '• ' },
          { tag: 'text', text: item.title, text_decoration: { bold: true } },
          { tag: 'text', text: '\n' },
          { tag: 'text', text: `   ${item.description}` },
        ],
      },
    });
  });

  return blocks;
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('🤖 开始生成AI日报...');

    // 获取当天日期
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const title = `AI日报 ${dateStr}`;

    // 获取内容
    console.log('📥 获取AI资讯内容...');
    const content = await fetchAIContent();

    // 获取Access Token
    console.log('🔐 获取飞书Access Token...');
    const appToken = await getAppAccessToken();

    // 发送消息（优先群聊，其次个人）
    if (FEISHU_CHAT_ID) {
      console.log(`📨 发送AI日报到群聊...`);
      const message = buildSimpleMessage(content);
      await sendRichMessage(appToken, FEISHU_CHAT_ID, `📰 AI日报 ${dateStr}`, message, 'chat_id');
    } else if (FEISHU_USER_ID) {
      console.log(`📨 发送AI日报给用户...`);
      const message = buildSimpleMessage(content);
      await sendRichMessage(appToken, FEISHU_USER_ID, `📰 AI日报 ${dateStr}`, message, 'open_id');
    }

    console.log('🎉 AI日报生成完成！');
    return { success: true };

  } catch (error) {
    console.error('❌ 生成日报失败:', error.message);
    return { success: false, error: error.message };
  }
}

// 导出供模块使用
module.exports = { main };

// 如果直接运行
if (require.main === module) {
  main().then(result => {
    process.exit(result.success ? 0 : 1);
  });
}
