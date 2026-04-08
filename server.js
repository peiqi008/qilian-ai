const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const session = require('express-session');
const https = require('https');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== 账号配置 ====================
const ADMIN_USER = 'admin';
const ADMIN_PWD = '123456';

// ==================== 微信推送配置（PushPlus） ====================
const PUSHPLUS_TOKEN = '0461e12c3d524c2f8d7747df46edbb5f'; // 👈 替换成你的

// ==================== 短信配置（可选） ====================
const SMS_ENABLE = false;
const SMS_PHONE = '';

// ==================== 固定无需动 ====================
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: 'ai_robot_202604',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 86400000 }
}));

app.use(express.static(__dirname));

const DATA_FILE = path.join(__dirname, 'form-data.json');
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

const NOTIFICATION_SOUND = path.join(__dirname, 'notification.mp3');

// 播放提示音
function playSound() {
    try {
        if (process.platform === 'win32') exec(`start "" "${NOTIFICATION_SOUND}"`);
        else if (process.platform === 'darwin') exec(`afplay "${NOTIFICATION_SOUND}"`);
        else if (process.platform === 'linux') exec(`aplay "${NOTIFICATION_SOUND}"`);
    } catch (e) {}
}

// ==================== 微信推送（PushPlus 稳定版） ====================
function sendWxPush(data) {
    if (!PUSHPLUS_TOKEN) return;

    const content = `
【AI电销机器人 - 新线索】
📞 联系电话：${data.phone}
🏢 所属行业：${data.industry}
👤 客户称呼：${data.name || '未填写'}
💬 需求备注：${data.demand || '无'}
⏰ 提交时间：${new Date().toLocaleString()}
    `.trim();

    const postData = JSON.stringify({
        token: PUSHPLUS_TOKEN,
        title: '新客户表单提交',
        content: content
    });

    const options = {
        hostname: 'www.pushplus.plus',
        port: 443,
        path: '/send',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const req = https.request(options, (res) => {
        res.resume();
    });
    req.write(postData);
    req.end();
}

// 短信推送（预留）
function sendSms(data) {
    if (!SMS_ENABLE || !SMS_PHONE) return;
    // 正式商用可对接阿里云/腾讯云短信
}

// ==================== 登录接口 ====================
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USER && password === ADMIN_PWD) {
        req.session.isLogin = true;
        return res.json({ success: true });
    }
    res.json({ success: false });
});

app.get('/api/checkLogin', (req, res) => {
    res.json({ success: !!req.session.isLogin });
});

// ==================== 后台数据 ====================
app.get('/api/admin/data', (req, res) => {
    if (!req.session.isLogin) return res.status(401).json({ success: false });
    try {
        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        res.json({ success: true, data });
    } catch (e) {
        res.json({ success: false });
    }
});

// ==================== 提交表单（核心） ====================
app.post('/api/submit', (req, res) => {
    try {
        const formData = req.body;
        const newEntry = {
            id: Date.now(),
            ...formData,
            submitTime: new Date().toISOString()
        };

        const list = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        list.unshift(newEntry); // 最新放前面
        fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2));

        // 三重提醒
        playSound();
        sendWxPush(formData);
        sendSms(formData);

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

app.listen(PORT, () => {
    console.log(`服务已启动：http://localhost:${PORT}`);
    console.log(`后台账号：${ADMIN_USER} / ${ADMIN_PWD}`);
});