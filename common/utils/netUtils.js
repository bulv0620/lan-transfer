var net = require('net')

// 检测端口是否被占用
function portIsOccupied(port) {
    return new Promise((resolve, reject) => {
        // 创建服务并监听该端口
        var server = net.createServer().listen(port)

        server.on('listening', function () {
            server.close() // 关闭服务
            resolve();
        })

        server.on('error', function (err) {
            if (err.code === 'EADDRINUSE') { // 端口已经被使用
                reject(err)
            }
        })
    })
}

module.exports = {portIsOccupied}