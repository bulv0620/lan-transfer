const fs = require('fs');
const path = require('path');

// 增加文件夹
function createFolder(dirpath, dirname) {
    if (typeof dirname === "undefined") {
        if (fs.existsSync(dirpath)) {
        } else {
            createFolder(dirpath, path.dirname(dirpath));
        }
    } else {
        if (dirname !== path.dirname(dirpath)) {
            createFolder(dirpath);
            return;
        }
        if (fs.existsSync(dirname)) {
            fs.mkdirSync(dirpath)
        } else {
            createFolder(dirname, path.dirname(dirname));
            fs.mkdirSync(dirpath);
        }
    }
}

// 复制文件
function copyFile(orgfilepath, desdirpath, desfilename) {
    if (fs.existsSync(orgfilepath)) {
        let desfilepath = path.join(desdirpath, desfilename);
        if (!fs.existsSync(desfilepath)) {
            createFolder(desdirpath);
            fs.copyFileSync(orgfilepath, desfilepath);
        } else {
            console.error(Date().toString() + "FolderAndFileOperation_copyFile: des file already existed." + " new path: " + desfilepath.toString());
        }
    } else {
        console.error(Date().toString() + "FolderAndFileOperation_copyFile: org file not existed." + " org path: " + orgfilepath.toString());
    }
}

// 删除文件夹内部文件
function deleteFiles(path) {
    let files = [];
    if (fs.existsSync(path)) {
        files = fs.readdirSync(path);
        files.forEach(function (file, index) {
            let curPath = path + "/" + file;
            if (fs.statSync(curPath).isDirectory()) { // recurse
                deleteall(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
    }
}


module.exports = {
    deleteFiles, copyFile, createFolder
}