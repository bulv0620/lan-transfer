const multer = require('multer');

// 获取请求的ip地址
function getRequestIpAddress(req) {
    let originIp = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

    return originIp.split(':')[3];
}

// multer配置
function fileUpdate(path) {
    // 文件上传配置
    const fileStorage = multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, path);
        }
    });

    return multer({
        storage: fileStorage,
        fileFilter: (req, file, callback) => {
            // 解决中文名乱码的问题
            file.originalname = Buffer.from(file.originalname, "latin1").toString(
                "utf8"
            );
            callback(null, true);
        }
    })
}

module.exports = {
    getRequestIpAddress, fileUpdate
}