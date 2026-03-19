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
        name: '新智元',
        shortName: '新智元',
        url: 'https://aiera.com.cn/',
        rss: 'https://aiera.com.cn/feed',
        categoryMapping: {
            '大模型': 'model', 'GPT': 'model', 'Claude': 'model', 'DeepSeek': 'model', 'Gemini': 'model',
            '技术': 'tech', '论文': 'tech', '算法': 'tech',
            '融资': 'company', '发布': 'company',
            '产品': 'application', '应用': 'application',
            'Agent': 'agent', '智能体': 'agent',
            '行业': 'industry', '趋势': 'industry'
        }
    },
    {
        name: 'AI科技评论',
        shortName: 'AI科技评论',
        url: 'https://sp.atyun.com/c/news',
        rss: 'https://sp.atyun.com/feed',
        categoryMapping: {
            '大模型': 'model', 'GPT': 'model', 'Claude': 'model', 'DeepSeek': 'model',
            '技术': 'tech', '论文': 'tech', '研究': 'tech',
            '融资': 'company', '发布': 'company',
            '产品': 'application', '应用': 'application',
            'Agent': 'agent', '智能体': 'agent',
            '行业': 'industry', '趋势': 'industry'
        }
    },
    {
        name: 'Founder Park',
        shortName: 'Founder Park',
        url: 'https://founderpark.net/',
        rss: 'https://founderpark.net/feed',
        categoryMapping: {
            '大模型': 'model', 'GPT': 'model', 'AI': 'model',
            '技术': 'tech',
            '融资': 'company', '发布': 'company', '创业': 'company', '投资': 'company',
            '产品': 'application', '应用': 'application',
            'Agent': 'agent', '智能体': 'agent',
            '行业': 'industry', '趋势': 'industry'
        }
    }
];

// 备用数据
const FALLBACK_NEWS = [
    { id: '1', title: 'DeepSeek发布最新多模态模型', summary: '该模型支持图像、文本、音频多模态理解，在多项基准测试中超越同级别模型表现。', source: '量子位', source_url: 'https://www.qbitai.com/', publish_time: getCurrentDateTime(), category: 'model', tags: ['开源', '多模态'] },
    { id: '2', title: 'OpenAI GPT-5进入最终测试阶段', summary: 'OpenAI官方确认GPT-5已完成内部测试，预计下月正式发布。', source: '36氪', source_url: 'https://www.36kr.com/', publish_time: getCurrentDateTime(), category: 'model', tags: ['GPT-5', 'OpenAI'] },
    { id: '3', title: 'MIT发布新型注意力机制', summary: 'MIT研究团队提出Flash Linear Attention新型注意力机制，大幅提升推理速度。', source: '机器之心', source_url: 'https://www.jiqizhixin.com/', publish_time: getCurrentDateTime(), category: 'tech', tags: ['论文', '注意力机制'] },
    { id: '4', title: '英伟达发布新一代AI芯片', summary: '英伟达推出Blackwell Ultra AI芯片，AI训练性能提升3倍。', source: '新智元', source_url: 'https://aiera.com.cn/', publish_time: getYesterdayDateTime(), category: 'company', tags: ['芯片', '英伟达'] },
    { id: '5', title: '阿里云推出企业级AI Agent平台', summary: '阿里云发布百炼平台企业版，提供一站式AI Agent开发工具。', source: 'AI科技评论', source_url: 'https://sp.atyun.com/', publish_time: getYesterdayDateTime(), category: 'application', tags: ['Agent', '阿里云'] },
    { id: '6', title: 'Anthropic发布Claude Enterprise', summary: 'Claude Enterprise支持大规模部署，提供企业级安全管控功能。', source: 'Founder Park', source_url: 'https://founderpark.net/', publish_time: getYesterdayDateTime(), category: 'agent', tags: ['Claude', '企业版'] },
    { id: '7', title: '2026年AI行业趋势报告', summary: '预测AI Agent市场规模将突破千亿美元，AI原生应用将迎来爆发期。', source: '36氪', source_url: 'https://www.36kr.com/', publish_time: getTwoDaysAgoDateTime(), category: 'industry', tags: ['报告', '趋势'] },
    { id: '8', title: 'Google DeepMind发布Gemini 2.5 Pro', summary: 'Gemini 2.5 Pro在多项基准测试中创下新纪录。', source: '新智元', source_url: 'https://aiera.com.cn/', publish_time: getTwoDaysAgoDateTime(), category: 'model', tags: ['Google', 'Gemini'] }
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
    const tagKeywords = ['GPT', 'Claude', 'DeepSeek', 'Gemini', 'Agent', '开源', '多模态', '芯片', '论文', '产品'];
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
