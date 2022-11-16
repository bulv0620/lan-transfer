module.exports = {
    findOnlineDevices, onlineVerify
}

const axios = require('axios')
const service = axios.create({
    timeout: 2000
})

async function onlineVerify(devices, hostname) {
    const task = [];
    devices.forEach(device => {
        task.push(verify(device.ip, hostname));
    })

    const res = await Promise.all(task);

    return res.map(value => {
        return value ? true : false
    });
}

/**
 * 发现在线主机
 * @param {number} port 扫描的端口
 * @returns 在线的主机信息
 */
async function findOnlineDevices(port = 3000, hostname) {
    const ipSet = getMyIpAdress();
    const devices = [];
    const task = [];
    for (let ip of ipSet) {
        task.push(scanDevices(ip, port, hostname));
    }

    const res = await Promise.all(task);
    res.forEach(item => {
        devices.push(...item);
    })

    return devices
}

/**
 * 获得本机连接的所有ip
 * @returns ip数组
 */
function getMyIpAdress() {
    const { networkInterfaces } = require('os');

    const nets = networkInterfaces();
    const results = Object.create(null);

    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
            if (net.family === familyV4Value && !net.internal) {
                if (!results[name]) {
                    results[name] = [];
                }
                results[name].push(net.address);
            }
        }
    }

    const ipSet = new Set();

    Object.values(results).forEach(value => {
        ipSet.add(...value)
    })

    return ipSet
}

/**
 * 扫描网段中的主机
 * @param {string} ip 扫描的网段（当前默认认为ip掩码为255.255.255.0）
 * @param {number} port 扫描的端口
 * @returns 在线的主机信息
 */
async function scanDevices(ip = '192.168.0.1', port, hostname) {

    const arr = ip.split('.');
    const ipSegment = arr[0] + '.' + arr[1] + '.' + arr[2]

    const task = []
    for (let i = 1; i <= 255; i++) {
        ipAdr = `${ipSegment}.${i}`;
        if (ipAdr === ip) continue;
        task.push(verify(`${ipAdr}:${port}`, hostname))
    }

    const res = await Promise.all(task);

    return res.filter(Boolean)
}

async function verify(url, hostname) {
    try {
        const res = await service.get(`http://${url}/api/verify${hostname ? `?hostname=${hostname}` : ''}`);
        if (res.data.code === 1 && res.data.msg === 'online') {
            return {
                hostname: res.data.data.hostname,
                ip: url
            }
        }
    } catch (error) {
        return false
    }
}