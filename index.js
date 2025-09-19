const { Client } = require('discord.js-selfbot-v13');
const puppeteer = require('puppeteer');
const fs = require('fs');

// 加载环境变量
require('dotenv').config();

// 配置项
const TOKEN = process.env.TOKEN || 'YOUR_TOKEN';
const SMOGON_USERNAME = process.env.SMOGON_USERNAME || 'YOUR_SMOGON_USERNAME';
const SMOGON_PASSWORD = process.env.SMOGON_PASSWORD || 'YOUR_SMOGON_PASSWORD';
const CHANNEL_ID = process.env.CHANNEL_ID || '1236577762114801758';
const HEADLESS = process.env.HEADLESS !== 'true'; // 默认 false 用于调试
const COOLDOWN_MS = parseInt(process.env.COOLDOWN_MS) || 5000;
const SKIP_ALREADY_LIKED = process.env.SKIP_ALREADY_LIKED === 'true';
const RUN_TESTS = process.env.RUN_TESTS === 'true';
const MESSAGE_LIMIT = parseInt(process.env.MESSAGE_LIMIT) || 100;
const TEST_LIKE_URL = 'https://www.smogon.com/forums/posts/10687082/react?reaction_id=1';
const LINK_PATTERN = /https?:\/\/www\.smogon\.com\/forums\/threads\/[^\/\s]+(?:\/page-\d+)?(?:(?:#post-|\/post-)(\d+))/i;

// 延迟函数
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// 检测页面类型（检查“Remove”按钮）
async function detectPageType(page) {
  await delay(3000); // 等待动态内容加载
  const removeButton = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
      if (button.innerText.toLowerCase().includes('remove')) {
        return true;
      }
    }
    return false;
  });
  const bodyText = await page.evaluate(() => document.body.innerText.toLowerCase());
  const isCancelPage = removeButton || bodyText.includes('remove');
  return isCancelPage ? 'cancel_reaction' : 'add_reaction';
}

// 点赞帖子
async function likePost(likeUrl) {
  console.log(`开始为 ${likeUrl} 点赞`);
  let browser;
  let page;
  try {
    browser = await puppeteer.launch({
      headless: HEADLESS,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    page = await browser.newPage();
    console.log('浏览器和页面已创建');
    
    // 加载 cookies
    if (fs.existsSync('smogon-cookies.json')) {
      const cookies = JSON.parse(fs.readFileSync('smogon-cookies.json'));
      await page.setCookie(...cookies);
      console.log('已加载 smogon-cookies.json 中的 cookies');
    } else {
      console.log('未找到 smogon-cookies.json，将尝试登录');
    }
    
    // 导航到点赞页面
    console.log(`正在导航到 ${likeUrl}`);
    await page.goto(likeUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    console.log(`当前页面: ${page.url()}`);
    
    // 处理登录
    if (page.url().includes('login')) {
      console.log('需要登录，正在尝试备用登录...');
      const loginInput = await page.$('input[name="login"]');
      const passwordInput = await page.$('input[name="password"]');
      const submitButton = await page.$('button[type="submit"]');
      if (!loginInput || !passwordInput || !submitButton) {
        const pageContent = await page.content();
        const debugFile = `debug-login-${new Date().toISOString().replace(/[:.]/g, '-')}.html`;
        fs.writeFileSync(debugFile, pageContent);
        console.log(`登录表单无效，调试文件保存至 ${debugFile}`);
        throw new Error('未找到登录表单元素');
      }
      await page.type('input[name="login"]', SMOGON_USERNAME);
      await page.type('input[name="password"]', SMOGON_PASSWORD);
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      ]);
      console.log(`登录已提交，当前页面: ${page.url()}`);
      await page.context().cookies().then(cookies => fs.writeFileSync('cookies.json', JSON.stringify(cookies)));
      await page.goto(likeUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      console.log(`登录后重新导航，当前页面: ${page.url()}`);
    }
    
    // 检测页面类型
    const pageType = await detectPageType(page);
    console.log(`页面类型: ${pageType === 'cancel_reaction' ? '取消点赞' : '添加点赞'}`);
    if (pageType === 'cancel_reaction' && SKIP_ALREADY_LIKED) {
      console.log('帖子已点赞，因 SKIP_ALREADY_LIKED=true 跳过');
      return;
    }
    
    // 寻找确认按钮
    const selectors = [
      'button.button--icon--confirm',
      'button.button--primary',
      'button[type="submit"]',
    ];
    
    let usedSelector = null;
    let confirmButton = null;
    for (const selector of selectors) {
      console.log(`尝试选择器: ${selector}`);
      confirmButton = await page.$(selector);
      if (confirmButton) {
        usedSelector = selector;
        break;
      }
    }
    
    if (!usedSelector) {
      console.log('未找到确认按钮，保存调试文件...');
      const pageContent = await page.content();
      const debugFile = `debug-${new Date().toISOString().replace(/[:.]/g, '-')}.html`;
      fs.writeFileSync(debugFile, pageContent);
      console.log(`调试文件保存至 ${debugFile}`);
      throw new Error('未找到确认按钮');
    }
    
    // 点击并处理导航
    console.log(`点击选择器 ${usedSelector} 的按钮`);
    const [response] = await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => null),
      page.click(usedSelector),
    ]);
    
    if (response) {
      console.log(`点击后导航状态: ${response.status()} - ${response.statusText()}`);
      if (response.status() === 502) {
        console.log('502 Bad Gateway - 应用冷却时间');
        await delay(COOLDOWN_MS);
      }
    }
    
    console.log(`✅ 点赞操作${pageType === 'cancel_reaction' ? '已取消' : '已完成'}`);
    
  } catch (error) {
    console.error(`点赞错误: ${error.message}`);
    if (page) {
      const pageContent = await page.content();
      const debugFile = `debug-error-${new Date().toISOString().replace(/[:.]/g, '-')}.html`;
      fs.writeFileSync(debugFile, pageContent);
      console.log(`调试文件保存至 ${debugFile}`);
    }
  } finally {
    if (browser) {
      console.log('关闭浏览器');
      await browser.close();
    }
    console.log(`应用 ${COOLDOWN_MS}ms 冷却时间`);
    await delay(COOLDOWN_MS);
  }
}

// 逐步测试（可选）
async function testStep1AccessPageWithCookies() {
  console.log('\n=== 测试 1: 使用 Cookies 访问页面 ===');
  let browser;
  let page;
  try {
    browser = await puppeteer.launch({
      headless: HEADLESS,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    page = await browser.newPage();
    console.log('浏览器和页面已创建');
    
    if (fs.existsSync('smogon-cookies.json')) {
      const cookies = JSON.parse(fs.readFileSync('smogon-cookies.json'));
      await page.setCookie(...cookies);
      console.log('已加载 smogon-cookies.json 中的 cookies');
    }
    
    console.log(`正在导航到 ${TEST_LIKE_URL}`);
    await page.goto(TEST_LIKE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    console.log(`当前页面: ${page.url()}`);
    
    if (page.url().includes('login')) {
      console.log('❌ 失败: 重定向到登录页面 - cookies 无效或缺失');
      console.log('尝试备用登录...');
      await page.type('input[name="login"]', SMOGON_USERNAME);
      await page.type('input[name="password"]', SMOGON_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
      console.log(`备用登录后，当前页面: ${page.url()}`);
      if (page.url().includes('login')) {
        console.log('❌ 失败: 备用登录失败 - 请检查用户名和密码');
        return false;
      }
      await page.goto(TEST_LIKE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
      console.log(`登录后重新导航，当前页面: ${page.url()}`);
    }
    
    console.log('✅ 成功: 已加载点赞页面');
    const pageType = await detectPageType(page);
    console.log(`页面类型: ${pageType === 'cancel_reaction' ? '取消点赞' : '添加点赞'}`);
    return true;
  } catch (error) {
    console.error(`测试 1 错误: ${error.message}`);
    if (page) {
      const pageContent = await page.content();
      const debugFile = `debug-step1-${new Date().toISOString().replace(/[:.]/g, '-')}.html`;
      fs.writeFileSync(debugFile, pageContent);
      console.log(`调试文件保存至 ${debugFile}`);
    }
    return false;
  } finally {
    if (browser) await browser.close();
  }
}

async function testStep2ButtonDetection() {
  console.log('\n=== 测试 2: 按钮检测 ===');
  let browser;
  let page;
  try {
    browser = await puppeteer.launch({
      headless: HEADLESS,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    page = await browser.newPage();
    
    if (fs.existsSync('smogon-cookies.json')) {
      const cookies = JSON.parse(fs.readFileSync('smogon-cookies.json'));
      await page.setCookie(...cookies);
      console.log('已加载 smogon-cookies.json 中的 cookies');
    }
    
    await page.goto(TEST_LIKE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    
    if (page.url().includes('login')) {
      await page.type('input[name="login"]', SMOGON_USERNAME);
      await page.type('input[name="password"]', SMOGON_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
      await page.goto(TEST_LIKE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    }
    
    const pageType = await detectPageType(page);
    console.log(`页面类型: ${pageType === 'cancel_reaction' ? '取消点赞' : '添加点赞'}`);
    if (pageType === 'cancel_reaction' && SKIP_ALREADY_LIKED) {
      console.log('帖子已点赞，在完整运行中将跳过');
    }
    
    const selectors = [
      'button.button--icon--confirm',
      'button.button--primary',
      'button[type="submit"]',
    ];
    
    let found = false;
    let usedSelector = null;
    for (const selector of selectors) {
      console.log(`尝试选择器: ${selector}`);
      const button = await page.$(selector);
      if (button) {
        usedSelector = selector;
        found = true;
        console.log(`✅ 成功: 找到选择器 ${usedSelector} 的按钮`);
        break;
      } else {
        console.log(`❌ 未找到选择器 ${selector} 的按钮`);
      }
    }
    
    if (!found) {
      console.log('❌ 失败: 未找到确认按钮 - 保存调试文件');
      const pageContent = await page.content();
      const debugFile = `debug-step2-${new Date().toISOString().replace(/[:.]/g, '-')}.html`;
      fs.writeFileSync(debugFile, pageContent);
      console.log(`调试文件保存至 ${debugFile}`);
    }
    
    return found;
  } catch (error) {
    console.error(`测试 2 错误: ${error.message}`);
    if (page) {
      const pageContent = await page.content();
      const debugFile = `debug-step2-${new Date().toISOString().replace(/[:.]/g, '-')}.html`;
      fs.writeFileSync(debugFile, pageContent);
      console.log(`调试文件保存至 ${debugFile}`);
    }
    return false;
  } finally {
    if (browser) await browser.close();
  }
}

async function testStep3ButtonClick() {
  console.log('\n=== 测试 3: 按钮点击 ===');
  let browser;
  let page;
  try {
    browser = await puppeteer.launch({
      headless: HEADLESS,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    page = await browser.newPage();
    
    if (fs.existsSync('smogon-cookies.json')) {
      const cookies = JSON.parse(fs.readFileSync('smogon-cookies.json'));
      await page.setCookie(...cookies);
      console.log('已加载 smogon-cookies.json 中的 cookies');
    }
    
    await page.goto(TEST_LIKE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    
    if (page.url().includes('login')) {
      await page.type('input[name="login"]', SMOGON_USERNAME);
      await page.type('input[name="password"]', SMOGON_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
      await page.goto(TEST_LIKE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    }
    
    const pageType = await detectPageType(page);
    console.log(`页面类型: ${pageType === 'cancel_reaction' ? '取消点赞' : '添加点赞'}`);
    if (pageType === 'cancel_reaction' && SKIP_ALREADY_LIKED) {
      console.log('帖子已点赞，跳过点击测试');
      return true;
    }
    
    const selectors = [
      'button.button--icon--confirm',
      'button.button--primary',
      'button[type="submit"]',
    ];
    
    let clicked = false;
    let usedSelector = null;
    for (const selector of selectors) {
      const button = await page.$(selector);
      if (button) {
        console.log(`找到选择器 ${selector} 的按钮，正在点击...`);
        const [response] = await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => null),
          page.click(selector),
        ]);
        
        if (response) {
          console.log(`点击后导航状态: ${response.status()} - ${response.statusText()}`);
          if (response.status() === 502) {
            console.log('502 Bad Gateway - 应用冷却时间');
            await delay(COOLDOWN_MS);
          }
        }
        
        clicked = true;
        console.log(`✅ 成功: 按钮点击完成（${pageType === 'cancel_reaction' ? '已取消' : '已点赞'}）`);
        break;
      }
    }
    
    if (!clicked) {
      console.log('❌ 失败: 未找到按钮 - 保存调试文件');
      const pageContent = await page.content();
      const debugFile = `debug-step3-${new Date().toISOString().replace(/[:.]/g, '-')}.html`;
      fs.writeFileSync(debugFile, pageContent);
      console.log(`调试文件保存至 ${debugFile}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`测试 3 错误: ${error.message}`);
    if (page) {
      const pageContent = await page.content();
      const debugFile = `debug-step3-${new Date().toISOString().replace(/[:.]/g, '-')}.html`;
      fs.writeFileSync(debugFile, pageContent);
      console.log(`调试文件保存至 ${debugFile}`);
    }
    return false;
  } finally {
    if (browser) await browser.close();
  }
}

// 运行测试（若启用）并扫描 Discord
async function runTestsAndScan() {
  console.log(`Smogon 点赞机器人启动于 ${new Date().toLocaleString('zh-CN')}`);
  console.log(`配置: SKIP_ALREADY_LIKED=${SKIP_ALREADY_LIKED}, HEADLESS=${HEADLESS}, COOLDOWN_MS=${COOLDOWN_MS}, RUN_TESTS=${RUN_TESTS}, MESSAGE_LIMIT=${MESSAGE_LIMIT}`);
  
  if (RUN_TESTS) {
    console.log('\n正在运行逐步测试...\n');
    
    const step1 = await testStep1AccessPageWithCookies();
    if (!step1) {
      console.log('测试 1 失败 - 停止执行');
      return;
    }
    
    const step2 = await testStep2ButtonDetection();
    if (!step2) {
      console.log('测试 2 失败 - 停止执行');
      return;
    }
    
    const step3 = await testStep3ButtonClick();
    if (!step3) {
      console.log('测试 3 失败 - 停止执行');
      return;
    }
    
    console.log('\n所有测试成功完成！');
  } else {
    console.log('\n跳过测试 (RUN_TESTS=false)');
  }
  
  console.log('\n开始扫描 Discord...\n');
  
  const client = new Client();
  client.on('ready', async () => {
    console.log(`登录为 ${client.user.tag} 于 ${new Date().toLocaleString('zh-CN')}`);
    const channel = await client.channels.fetch(CHANNEL_ID, { force: true });
    if (!channel) {
      console.log('未找到频道！请检查 CHANNEL_ID 和权限。');
      return;
    }
    
    console.log(`正在扫描频道 ${channel.name} 的历史消息（限制: ${MESSAGE_LIMIT} 条）`);
    const messages = await channel.messages.fetch({ limit: MESSAGE_LIMIT, force: true });
    console.log(`找到 ${messages.size} 条消息`);
    
    for (const message of messages.values()) {
      console.log(`消息内容: ${message.content}`);
      const matches = message.content.match(LINK_PATTERN);
      console.log(`消息 ${message.id} 的匹配结果:`, matches);
      if (matches && matches[1]) {
        const postId = matches[1];
        const likeUrl = `https://www.smogon.com/forums/posts/${postId}/react?reaction_id=1`;
        console.log(`处理帖子: ${likeUrl}`);
        await likePost(likeUrl);
      }
    }
  });
  
  client.on('messageCreate', async (message) => {
    if (message.channelId === CHANNEL_ID) {
      console.log(`新消息: ${message.content}`);
      const matches = message.content.match(LINK_PATTERN);
      console.log(`新消息 ${message.id} 的匹配结果:`, matches);
      if (matches && matches[1]) {
        const postId = matches[1];
        const likeUrl = `https://www.smogon.com/forums/posts/${postId}/react?reaction_id=1`;
        console.log(`处理新帖子: ${likeUrl}`);
        await likePost(likeUrl);
      }
    }
  });
  
  client.login(TOKEN).catch(error => {
    if (error.message.includes('invalid token')) {
      console.error('Discord 登录失败：令牌无效，请检查 .env 文件中的 TOKEN是否需要更新');
    } else {
      console.error(`Discord 登录失败: ${error.message}`);
    }
  });
}

runTestsAndScan().catch(error => {
  console.error(`致命错误: ${error.message}`);
});