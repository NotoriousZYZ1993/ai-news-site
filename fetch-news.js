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
    // 核心科技媒体
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
    // 新增AI资讯源
    {
        name: '虎嗅AI',
        shortName: '虎嗅AI',
        url: 'https://www.huxiu.com/channel/1028',
        rss: 'https://www.huxiu.com/channel/1028/rss',
        categoryMapping: {
            '大模型': 'model', 'GPT': 'model', 'AI': 'model',
            '技术': 'tech', '融资': 'company', '产品': 'application', '行业': 'industry'
        }
    },
    {
        name: '脑极宫',
        shortName: '脑极宫',
        url: 'https://www.naojigong.com/',
        rss: 'https://www.naojigong.com/feed',
        categoryMapping: {
            '大模型': 'model', 'AI': 'model', '技术': 'tech', '行业': 'industry', '观点': 'industry'
        }
    },
    {
        name: 'Super黄的AI观察',
        shortName: 'Super黄',
        url: 'https://www.superhuang.com/',
        rss: 'https://www.superhuang.com/feed',
        categoryMapping: {
            'AI': 'model', '观察': 'industry', '分析': 'industry'
        }
    },
    {
        name: '孤独的独角兽',
        shortName: '独角兽',
        url: 'https://www.dujiaoshou.io/',
        rss: 'https://www.dujiaoshou.io/feed',
        categoryMapping: {
            'AI': 'model', '大模型': 'model', '融资': 'company', '创业': 'company', '行业': 'industry'
        }
    },
    {
        name: 'AI增长前线',
        shortName: 'AI增长前线',
        url: 'https://www.aigrowth.io/',
        rss: 'https://www.aigrowth.io/feed',
        categoryMapping: {
            'AI': 'model', '增长': 'application', '产品': 'application', '行业': 'industry'
        }
    },
    {
        name: '数字π',
        shortName: '数字π',
        url: 'https://www.shuzipai.com/',
        rss: 'https://www.shuzipai.com/feed',
        categoryMapping: {
            'AI': 'model', '大模型': 'model', '技术': 'tech', '行业': 'industry'
        }
    },
    {
        name: '元维度',
        shortName: '元维度',
        url: 'https://www.meta-dimension.com/',
        rss: 'https://www.meta-dimension.com/feed',
        categoryMapping: {
            'AI': 'model', '元宇宙': 'application', '技术': 'tech', '行业': 'industry'
        }
    },
    {
        name: '躺平指数',
        shortName: '躺平指数',
        url: 'https://www.tanping.com/',
        rss: 'https://www.tanping.com/feed',
        categoryMapping: {
            'AI': 'model', '科技': 'tech', '行业': 'industry'
        }
    },
    // 原有来源
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
        name: 'DeepSeek',
        shortName: 'DeepSeek',
        url: 'https://www.deepseek.com/blog',
        rss: 'https://www.deepseek.com/blog/rss.xml',
        categoryMapping: {
            'DeepSeek': 'model', '开源': 'model', '技术': 'tech', '论文': 'tech'
        }
    },
    {
        name: 'AIGC开放社区',
        shortName: 'AIGC开放社区',
        url: 'https://www.aigc.club/',
        rss: 'https://www.aigc.club/feed',
        categoryMapping: {
            '大模型': 'model', 'GPT': 'model', 'AIGC': 'application',
            '技术': 'tech', '产品': 'application', 'Agent': 'agent', '行业': 'industry'
        }
    },
    {
        name: 'Founderpark',
        shortName: 'Founderpark',
        url: 'https://founderpark.net/',
        rss: 'https://founderpark.net/feed',
        categoryMapping: {
            '大模型': 'model', 'AI': 'model', '融资': 'company', '创业': 'company', '产品': 'application'
        }
    }
];

// 备用数据
const FALLBACK_NEWS = [
    { id: '1', title: 'OpenAI发布GPT-4o新功能', summary: 'OpenAI宣布GPT-4o支持实时语音交互，性能大幅提升。', source: 'OpenAI', source_url: 'https://openai.com/blog', publish_time: getCurrentDateTime(), category: 'model', tags: ['GPT', 'OpenAI'] },
    { id: '2', title: '虎嗅：AI行业一周动态', summary: '虎嗅AI频道一周重要新闻汇总。', source: '虎嗅AI', source_url: 'https://www.huxiu.com/channel/1028', publish_time: getCurrentDateTime(), category: 'industry', tags: ['行业'] },
    { id: '3', title: '脑极宫：AI深度观察', summary: '脑极宫AI行业深度分析文章。', source: '脑极宫', source_url: 'https://www.naojigong.com/', publish_time: getYesterdayDateTime(), category: 'industry', tags: ['观察'] },
    { id: '4', title: '孤独的独角兽：AI创业观察', summary: 'AI创业公司最新动态。', source: '孤独的独角兽', source_url: 'https://www.dujiaoshou.io/', publish_time: getYesterdayDateTime(), category: 'company', tags: ['创业'] },
    { id: '5', title: 'AI增长前线：产品案例', summary: 'AI产品增长案例分析。', source: 'AI增长前线', source_url: 'https://www.aigrowth.io/', publish_time: getTwoDaysAgoDateTime(), category: 'application', tags: ['增长'] },
    { id: '6', title: '数字π：AI技术解读', summary: 'AI技术深度解读。', source: '数字π', source_url: 'https://www.shuzipai.com/', publish_time: getTwoDaysAgoDateTime(), category: 'tech', tags: ['技术'] },
    { id: '7', title: '元维度：AI与元宇宙', summary: 'AI与元宇宙结合趋势分析。', source: '元维度', source_url: 'https://www.meta-dimension.com/', publish_time: getTwoDaysAgoDateTime(), category: 'industry', tags: ['元宇宙'] },
    { id: '8', title: '量子位：最新AI新闻', summary: '量子位AI新闻汇总。', source: '量子位', source_url: 'https://www.qbitai.com/', publish_time: getCurrentDateTime(), category: 'industry', tags: ['行业'] }
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
    const tagKeywords = ['GPT', 'Claude', 'DeepSeek', 'Gemini', 'Llama', 'Agent', '开源', '多模态', '论文', 'AIGC'];
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
