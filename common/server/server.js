const express = require('express');
const cors = require('cors');
const path = require('path');
const events = require('events');
const shell = require('electron').shell
const os = require('os');
const { findOnlineDevices, onlineVerify } = require('./scan');
const { getRequestIpAddress, fileUpdate } = require('./config');
const { copyFile, createFolder } = require('../utils/fileUtiles');
const { dialog, app } = require('electron');
const storage = require('electron-localstorage');

storage.setStoragePath(path.join(__dirname,'local-cache.json'));

const DEFAULT_HOST_NAME = storage.getItem('HOST_NAME') || os.hostname();
const DEFAULT_DOWNLOAD_PATH = storage.getItem('DEFAULT_PATH') || path.resolve(os.homedir() + '/Downloads/LanTransfer');
const DEFAULT_TEMP_PATH = path.resolve(app.getAppPath() + '/temp');
const DEFAULT_PORT = 54188

class Server extends events {

    constructor(port) {
        super();
        this.app = express();
        this.port = port || DEFAULT_PORT;
        this.hostname = DEFAULT_HOST_NAME;
        this.path = DEFAULT_DOWNLOAD_PATH;
        this.temp = DEFAULT_TEMP_PATH;
        this.devices = [];
        this.init();
    }

    init() {
        // 创建下载目录和缓存目录
        createFolder(DEFAULT_DOWNLOAD_PATH);
        createFolder(DEFAULT_TEMP_PATH);

        // 监听端口
        this.app.listen(this.port);
        // 跨域
        this.app.use(cors());
        // 路由
        initRouter(this);
    }

    // 获取在线设备
    async getDevices() {
        this.devices = await findOnlineDevices(this.port, this.hostname);
        return this.devices;
    }

    // 检查线上设备在线情况
    async onlineVerify() {
        const res = await onlineVerify(this.devices, this.hostname);
        const removeIndex = [];
        res.forEach((bo, index) => {
            if (!bo) removeIndex.push(index);
        })

        removeIndex.forEach(i => {
            this.devices.splice(i, 1);
        })
    }

    // 设置设备名称
    setName(hostname) {
        this.hostname = hostname;
        storage.setItem('HOST_NAME', hostname);
    }

    // 设置保存路径
    setPath(path) {
        this.path = path;
        storage.setItem('DEFAULT_PATH', path);
    }

    // 添加设备
    addDevice(ip, hostname) {
        ip = ip.includes(':') ? ip : ip + ':' + this.port;
        const bo = this.devices.find((device) => {
            return device.ip === ip
        })

        if (!bo) {
            this.emit('new-device', { ip, hostname })
            this.devices.push({
                ip, hostname
            })
        }
    }
}

// 初始化路由
function initRouter(ctx) {
    // 验证接口
    ctx.app.get('/api/verify', (req, res) => {
        // 添加设备
        const ip = getRequestIpAddress(req);
        const hostname = req.query.hostname;
        ctx.addDevice(ip, hostname);

        res.send({
            code: 1,
            msg: 'online',
            data: {
                hostname: ctx.hostname
            }
        })
    });

    // 连接握手接口
    ctx.app.get('/api/confirm', async (req, res) => {
        const { code, hostname } = req.query;
        const { response: confirm } = await dialog.showMessageBox({
            title: '请求询问',
            type: 'question',
            message: `192.168.0.1:54188(${hostname}) 发起文件传输, 验证码:${code}, 是否接受`,
            buttons: ['ok', 'cancel']
        })
        if (confirm === 0) {
            res.send({
                code: 1,
                msg: 'ok'
            })
        }
        else {
            res.send({
                code: 0,
                msg: 'cancel'
            })
        }
    });

    // 文件传输接口
    ctx.app.post('/api/file', fileUpdate(ctx.temp).single('file'), (req, res) => {
        const file = req.file;

        copyFile(file.path, ctx.path, file.originalname);
        shell.openPath(ctx.path);
        res.send({
            code: 1,
            msg: 'finish'
        })
    })
}

module.exports = Server
