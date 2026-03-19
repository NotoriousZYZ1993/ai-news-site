/**
 * AI新闻爬虫脚本
 * 从多个AI新闻源抓取新闻
 * 
 * 使用方法: node fetch-news.js
 */

const fs = require('fs');
const path = require('path');

// 新闻来源配置 - 只保留能抓取的来源
const SOURCES = [
    {
        name: '量子位',
        shortName: '量子位',
        url: 'https://www.qbitai.com/',
        rss: 'https://www.qbitai.com/feed',
        categoryMapping: {
            '大模型': 'model', 'GPT': 'model', 'Claude': 'model', 'DeepSeek': 'model',
            '技术': 'tech', '论文': 'tech', '融资': 'company', '发布': 'company',
            '产品': 'application', 'Agent': 'agent', '行业': 'industry', '趋势': 'industry'
        }
    },
    {
        name: '36氪',
        shortName: '36氪',
        url: 'https://www.36kr.com/',
        rss: 'https://www.36kr.com/feed',
        categoryMapping: {
            '大模型': 'model', 'GPT': 'model', 'AI': 'model',
            '技术': 'tech', '融资': 'company', '发布': 'company',
            '产品': 'application', '行业': 'industry', '趋势': 'industry'
        }
    },
    {
        name: 'OpenAI',
        shortName: 'OpenAI',
        url: 'https://openai.com/blog',
        rss: 'https://openai.com/blog/rss.xml',
        categoryMapping: {
            'GPT': 'model', 'O1': 'model', 'Sora': 'model',
            '技术': 'tech', '产品': 'application', 'Agent': 'agent', '行业': 'industry'
        }
    },
    {
        name: '机器之心',
        shortName: '机器之心',
        url: 'https://www.jiqizhixin.com/',
        rss: 'https://www.jiqizhixin.com/feed',
        categoryMapping: {
            '大模型': 'model', 'GPT': 'model', '模型': 'model',
            '技术': 'tech', '论文': 'tech', '融资': 'company',
            '产品': 'application', 'Agent': 'agent', '行业': 'industry'
        }
    },
    {
        name: '月之暗面',
        shortName: '月之暗面',
        url: 'https://www.moonshot.cn/',
        rss: 'https://www.moonshot.cn/feed',
        categoryMapping: {
            '月之暗面': 'model', 'Kimi': 'model', '模型': 'model',
            '技术': 'tech', '研究': 'tech',
            '产品': 'application',
            '行业': 'industry'
        }
    },
    {
        name: 'MiniMax',
        shortName: 'MiniMax',
        url: 'https://www.minimaxi.com/',
        rss: 'https://www.minimaxi.com/feed',
        categoryMapping: {
            'MiniMax': 'model', '模型': 'model',
            '技术': 'tech', '研究': 'tech',
            '产品': 'application',
            '行业': 'industry'
        }
    },
    {
        name: '字节跳动',
        shortName: '字节跳动',
        url: 'https://www.bytedance.com/zh/',
        rss: 'https://www.bytedance.com/zh/blog/feed',
        categoryMapping: {
            '字节': 'model', '豆包': 'model', '模型': 'model',
            '技术': 'tech', '研究': 'tech',
            '产品': 'application', '应用': 'application',
            '行业': 'industry'
        }
    }
];

// 备用数据
const FALLBACK_NEWS = [
    { id: '1', title: '量子位：AI行业最新动态', summary: '量子位AI新闻汇总。', source: '量子位', source_url: 'https://www.qbitai.com/', publish_time: getCurrentDateTime(), category: 'industry', tags: ['行业'] },
    { id: '2', title: '36氪：AI一周新闻汇总', summary: '36氪 AI频道一周重要新闻。', source: '36氪', source_url: 'https://www.36kr.com/', publish_time: getCurrentDateTime(), category: 'industry', tags: ['行业'] },
    { id: '3', title: 'OpenAI发布新功能', summary: 'OpenAI产品更新。', source: 'OpenAI', source_url: 'https://openai.com/blog', publish_time: getCurrentDateTime(), category: 'model', tags: ['OpenAI'] },
    { id: '4', title: '机器之心：技术进展', summary: '机器之心AI技术文章。', source: '机器之心', source_url: 'https://www.jiqizhixin.com/', publish_time: getYesterdayDateTime(), category: 'tech', tags: ['技术'] },
    { id: '5', title: '月之暗面Kimi更新', summary: '月之暗面Kimi智能助手更新。', source: '月之暗面', source_url: 'https://www.moonshot.cn/', publish_time: getYesterdayDateTime(), category: 'agent', tags: ['Kimi'] },
    { id: '6', title: 'MiniMax模型更新', summary: 'MiniMax最新模型动态。', source: 'MiniMax', source_url: 'https://www.minimaxi.com/', publish_time: getTwoDaysAgoDateTime(), category: 'model', tags: ['模型'] },
    { id: '7', title: '字节跳动AI动态', summary: '字节跳动AI产品与研究动态。', source: '字节跳动', source_url: 'https://www.bytedance.com/', publish_time: getTwoDaysAgoDateTime(), category: 'model', tags: ['豆包'] }
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
    const tagKeywords = ['GPT', 'Claude', 'DeepSeek', 'Gemini', 'Llama', 'Agent', '开源', '多模态', '论文', 'Kimi', '豆包'];
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
