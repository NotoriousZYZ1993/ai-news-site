/**
 * AI新闻爬虫脚本
 * 从多个AI新闻源抓取新闻
 * 
 * 使用方法: node fetch-news.js
 */

const fs = require('fs');
const path = require('path');

// 新闻来源配置
const SOURCES = [
    // 国内科技媒体
    {
        name: '量子位',
        shortName: '量子位',
        url: 'https://www.qbitai.com/',
        rss: 'https://www.qbitai.com/feed',
        categoryMapping: {
            '大模型': 'model', 'GPT': 'model', 'Claude': 'model', 'DeepSeek': 'model', 'Gemini': 'model',
            '技术': 'tech', '论文': 'tech', '算法': 'tech',
            '融资': 'company', '发布': 'company', '财报': 'company',
            '产品': 'application', '应用': 'application',
            'Agent': 'agent', '智能体': 'agent',
            '行业': 'industry', '趋势': 'industry', '报告': 'industry'
        }
    },
    {
        name: '36氪',
        shortName: '36氪',
        url: 'https://www.36kr.com/',
        rss: 'https://www.36kr.com/feed',
        categoryMapping: {
            '大模型': 'model', 'GPT': 'model', 'AI': 'model', '模型': 'model',
            '技术': 'tech',
            '融资': 'company', '发布': 'company',
            '产品': 'application', '应用': 'application',
            '行业': 'industry', '趋势': 'industry'
        }
    },
    {
        name: '机器之心',
        shortName: '机器之心',
        url: 'https://www.jiqizhixin.com/',
        rss: 'https://www.jiqizhixin.com/feed',
        categoryMapping: {
            '大模型': 'model', 'GPT': 'model', '模型': 'model',
            '技术': 'tech', '论文': 'tech', '研究': 'tech',
            '融资': 'company', '发布': 'company', '合作': 'company',
            '应用': 'application', '产品': 'application',
            'Agent': 'agent', '智能体': 'agent',
            '行业': 'industry', '趋势': 'industry'
        }
    },
    // 大模型厂商官方博客
    {
        name: 'OpenAI',
        shortName: 'OpenAI',
        url: 'https://openai.com/blog',
        rss: 'https://openai.com/blog/rss.xml',
        categoryMapping: {
            'GPT': 'model', 'GPT-4': 'model', 'GPT-5': 'model', 'O1': 'model', 'Sora': 'model',
            'API': 'model', '模型': 'model',
            '技术': 'tech', '研究': 'tech',
            '产品': 'application', '应用': 'application',
            'Agent': 'agent',
            '行业': 'industry'
        }
    },
    {
        name: 'Anthropic',
        shortName: 'Anthropic',
        url: 'https://www.anthropic.com/blog',
        rss: 'https://www.anthropic.com/blog/rss.xml',
        categoryMapping: {
            'Claude': 'model', '模型': 'model',
            '技术': 'tech', '研究': 'tech',
            '产品': 'application', '应用': 'application',
            'Agent': 'agent', '智能体': 'agent',
            '行业': 'industry'
        }
    },
    {
        name: 'DeepSeek',
        shortName: 'DeepSeek',
        url: 'https://www.deepseek.com/blog',
        rss: 'https://www.deepseek.com/blog/rss.xml',
        categoryMapping: {
            'DeepSeek': 'model', '模型': 'model', '开源': 'model',
            '技术': 'tech', '论文': 'tech', '研究': 'tech',
            '产品': 'application', '应用': 'application',
            '行业': 'industry'
        }
    },
    {
        name: 'Google AI',
        shortName: 'Google AI',
        url: 'https://blog.google/technology/ai/',
        rss: 'https://blog.google/technology/ai/rss',
        categoryMapping: {
            'Gemini': 'model', 'PaLM': 'model', 'Google': 'model', '模型': 'model',
            '技术': 'tech', '研究': 'tech', '论文': 'tech',
            '产品': 'application', '应用': 'application',
            'Agent': 'agent', '智能体': 'agent',
            '行业': 'industry'
        }
    },
    {
        name: 'Meta AI',
        shortName: 'Meta AI',
        url: 'https://ai.facebook.com/blog',
        rss: 'https://ai.facebook.com/blog/rss.xml',
        categoryMapping: {
            'Llama': 'model', 'Meta': 'model', '模型': 'model', '开源': 'model',
            '技术': 'tech', '研究': 'tech', '论文': 'tech',
            '产品': 'application', '应用': 'application',
            '行业': 'industry'
        }
    },
    {
        name: 'Mistral AI',
        shortName: 'Mistral AI',
        url: 'https://mistral.ai/news/',
        rss: 'https://mistral.ai/news/rss.xml',
        categoryMapping: {
            'Mistral': 'model', '模型': 'model', '开源': 'model',
            '技术': 'tech', '研究': 'tech',
            '产品': 'application', '应用': 'application',
            '行业': 'industry'
        }
    },
    {
        name: '百度AI',
        shortName: '百度AI',
        url: 'https://ai.baidu.com/tech',
        rss: 'https://ai.baidu.com/feed/rss',
        categoryMapping: {
            '文心': 'model', 'ERNIE': 'model', '模型': 'model',
            '技术': 'tech', '研究': 'tech',
            '产品': 'application', '应用': 'application',
            '行业': 'industry'
        }
    },
    {
        name: '阿里云',
        shortName: '阿里云',
        url: 'https://developer.aliyun.com/ai',
        rss: 'https://developer.aliyun.com/ai/feed',
        categoryMapping: {
            '通义': 'model', 'Qwen': 'model', '模型': 'model',
            '技术': 'tech', '研究': 'tech',
            '产品': 'application', '应用': 'application',
            'Agent': 'agent', '智能体': 'agent',
            '行业': 'industry'
        }
    }
];

// 备用数据
const FALLBACK_NEWS = [
    { id: '1', title: 'OpenAI发布GPT-4o新功能', summary: 'OpenAI宣布GPT-4o支持实时语音交互，性能大幅提升。', source: 'OpenAI', source_url: 'https://openai.com/blog', publish_time: getCurrentDateTime(), category: 'model', tags: ['GPT', 'OpenAI'] },
    { id: '2', title: 'Anthropic发布Claude 4', summary: 'Claude 4在多项基准测试中超越GPT-4，性能创下新纪录。', source: 'Anthropic', source_url: 'https://www.anthropic.com/blog', publish_time: getCurrentDateTime(), category: 'model', tags: ['Claude', 'Anthropic'] },
    { id: '3', title: 'DeepSeek开源新模型DeepSeek-V3', summary: 'DeepSeek发布最新开源模型，性能比肩GPT-4。', source: 'DeepSeek', source_url: 'https://www.deepseek.com/blog', publish_time: getCurrentDateTime(), category: 'model', tags: ['开源', 'DeepSeek'] },
    { id: '4', title: 'Google发布Gemini 2.5', summary: 'Google DeepMind发布Gemini 2.5，多模态能力大幅提升。', source: 'Google AI', source_url: 'https://blog.google/technology/ai/', publish_time: getYesterdayDateTime(), category: 'model', tags: ['Gemini', 'Google'] },
    { id: '5', title: 'Meta开源Llama 4', summary: 'Meta发布Llama 4，性能超越闭源模型。', source: 'Meta AI', source_url: 'https://ai.facebook.com/blog', publish_time: getYesterdayDateTime(), category: 'model', tags: ['Llama', '开源'] },
    { id: '6', title: 'Mistral发布Mixtral 8x22B', summary: 'Mistral AI发布最新稀疏MoE模型。', source: 'Mistral AI', source_url: 'https://mistral.ai/news/', publish_time: getYesterdayDateTime(), category: 'model', tags: ['Mistral', '开源'] },
    { id: '7', title: '百度发布文心大模型4.5', summary: '百度发布新版文心大模型，推理能力提升。', source: '百度AI', source_url: 'https://ai.baidu.com/tech', publish_time: getTwoDaysAgoDateTime(), category: 'model', tags: ['文心', '百度'] },
    { id: '8', title: '阿里云发布通义千问2.5', summary: '阿里云发布新版通义千问，中文能力超越GPT-4。', source: '阿里云', source_url: 'https://developer.aliyun.com/ai', publish_time: getTwoDaysAgoDateTime(), category: 'model', tags: ['通义', '阿里云'] },
    { id: '9', title: '量子位：AI行业一周动态', summary: '本周AI行业重要新闻汇总。', source: '量子位', source_url: 'https://www.qbitai.com/', publish_time: getCurrentDateTime(), category: 'industry', tags: ['行业'] },
    { id: '10', title: '36氪：AI创业公司融资动态', summary: '本周AI领域融资事件汇总。', source: '36氪', source_url: 'https://www.36kr.com/', publish_time: getCurrentDateTime(), category: 'company', tags: ['融资'] }
];

function getCurrentDateTime() {
    return formatDateTime(new Date());
}

function getYesterdayDateTime() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return formatDateTime(d);
}

function getTwoDaysAgoDateTime() {
    const d = new Date();
    d.setDate(d.getDate() - 2);
    return formatDateTime(d);
}

function formatDateTime(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:00`;
}

function generateId() {
    return 'news_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function categorize(title, sourceName) {
    const source = SOURCES.find(s => s.name === sourceName);
    const mapping = source?.categoryMapping || {};
    for (const [keyword, category] of Object.entries(mapping)) {
        if (title.includes(keyword)) return category;
    }
    return 'model';
}

function extractTags(title) {
    const tags = [];
    const tagKeywords = ['GPT', 'Claude', 'DeepSeek', 'Gemini', 'Llama', 'Agent', '开源', '多模态', '论文', '产品'];
    for (const tag of tagKeywords) {
        if (title.includes(tag)) tags.push(tag);
    }
    return tags.length > 0 ? tags : ['AI'];
}

async function fetchRSS(source) {
    try {
        console.log(`📡 正在从 ${source.name} 获取RSS...`);
        const response = await fetch(source.rss, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const xml = await response.text();
        const items = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;
        
        while ((match = itemRegex.exec(xml)) !== null && items.length < 5) {
            const c = match[1];
            const titleMatch = c.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/);
            const linkMatch = c.match(/<link>(.*?)<\/link>/);
            const descMatch = c.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/);
            const pubDateMatch = c.match(/<pubDate>(.*?)<\/pubDate>/);
            
            if (titleMatch && linkMatch) {
                const title = titleMatch[1] || titleMatch[2] || '';
                const summary = descMatch ? (descMatch[1] || descMatch[2] || '').replace(/<[^>]*>/g, '').substring(0, 200) : '暂无摘要';
                items.push({
                    title: title.trim(),
                    summary: summary.trim() || '暂无摘要',
                    source: source.shortName,
                    source_url: linkMatch[1] || '',
                    publish_time: pubDateMatch ? new Date(pubDateMatch[1]).toISOString().replace('T', ' ').substring(0, 19) : getCurrentDateTime(),
                    category: categorize(title, source.name),
                    tags: extractTags(title)
                });
            }
        }
        console.log(`✅ 从 ${source.name} 获取了 ${items.length} 条新闻`);
        return items;
    } catch (error) {
        console.log(`⚠️ 从 ${source.name} 获取失败: ${error.message}`);
        return [];
    }
}

async function main() {
    console.log('🚀 AI新闻爬虫启动...\n');
    console.log(`📋 新闻来源: ${SOURCES.map(s => s.name).join(', ')}\n`);
    
    const allNews = [];
    for (const source of SOURCES) {
        const news = await fetchRSS(source);
        allNews.push(...news);
        // 避免请求过快
        await new Promise(r => setTimeout(r, 500));
    }
    
    if (allNews.length === 0) {
        console.log('\n⚠️ 无法获取实时新闻，使用备用数据\n');
        allNews.push(...FALLBACK_NEWS);
    }
    
    // 去重
    const seen = new Set();
    const uniqueNews = allNews.filter(news => {
        const key = news.title.substring(0, 30);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
    
    uniqueNews.sort((a, b) => new Date(b.publish_time) - new Date(a.publish_time));
    
    const finalNews = uniqueNews.map(news => ({
        ...news,
        id: news.id || generateId()
    })).slice(0, 20);
    
    const newsDataJS = JSON.stringify(finalNews, null, 4);
    const indexPath = path.join(__dirname, 'index.html');
    let html = fs.readFileSync(indexPath, 'utf-8');
    const oldDataRegex = /const newsData = \[[\s\S]*?\];/;
    
    if (oldDataRegex.test(html)) {
        html = html.replace(oldDataRegex, `const newsData = ${newsDataJS};`);
        fs.writeFileSync(indexPath, html, 'utf-8');
        console.log(`\n✅ 已更新 index.html，共 ${finalNews.length} 条新闻`);
        console.log(`📰 新闻来源统计:`);
        const sourceCount = {};
        finalNews.forEach(news => { sourceCount[news.source] = (sourceCount[news.source] || 0) + 1; });
        for (const [source, count] of Object.entries(sourceCount)) {
            console.log(`   - ${source}: ${count} 条`);
        }
    } else {
        console.log('❌ 未找到newsData数组');
        process.exit(1);
    }
    console.log('\n✨ 完成！');
}

main().catch(console.error);
