window.onload = function () {
    const { ipcRenderer } = require("electron");
    const fs = require("fs");
    const axios = require("axios");
    axios.defaults.headers.post["Content-Type"] = false;
    const oDragWrap = document.querySelector(".file-uploader"); // 拖拽上传模块
    const oFileName = document.querySelector(".file-info-name"); // 文件名p标签
    const oFileUrl = document.querySelector(".file-info-url"); // 文件地址p标签
    const oFileInput = document.querySelector("#file-input"); // 选择文件input标签
    const oHostSelect = document.querySelector("#host-select"); // 客户端选择select标签

    const CancelToken = axios.CancelToken; // 取消请求

    let uploadFile = null; // 当前选中的文件实例
    let hostname = "";
    let uploading = false;
    let cancelFn = null;

    ipcRenderer.send("get-hostname-req");

    // 发送按钮点击事件
    document.querySelector(".post-btn").addEventListener("click", () => {
        if (uploading) return;

        const select = document.querySelector("#host-select");
        const index = select.selectedIndex;

        if (!oFileName.textContent || !uploadFile) {
            showErrorAlert("文件错误", "未选择传输的文件");
        } else if (index === -1) {
            showErrorAlert("文件错误", "未选择发送目标");
        } else {
            const host = select.options[index].value;
            transfer(host, uploadFile);
        }
    });

    function transfer(host, file) {
        uploading = true;
        // 打开进度窗口
        ipcRenderer.send("open-progress-page");

        confirm(host)
            .then((res) => {
                cancelFn = null;
                if (res.data.code === 1) {
                    return post(host, file);
                } else {
                    throw new Error("远程主机拒绝了传输请求");
                }
            })
            .then((res) => {
                cancelFn = null;
                if (res.data.code === 1) {
                    // 清空文件
                    clear();
                }
            })
            .catch((err) => {
                if (err.message === "canceled") return;
                ipcRenderer.send("show-error", {
                    title: "error",
                    content: err.message,
                });
            })
            .finally(() => {
                // 关闭进度窗口
                ipcRenderer.send("hide-progress-page");
                uploading = false;
            });
    }

    function confirm(host) {
        const code = Math.random().toString().slice(-6);
        ipcRenderer.send("get-hostname-req");

        // 进度窗口信息(握手中(验证码：xxx))
        ipcRenderer.send("progress-data", {
            rate: 0,
            message: `握手中(验证码:${code})...`,
        });

        return axios.get(
            `http://${host}/api/confirm?code=${code}&hostname=${hostname}`,
            {
                timeout: 30000,
                cancelToken: new CancelToken(function executor(c) {
                    cancelFn = c;
                }),
            }
        );
    }

    function post(host, file) {
        const formData = new FormData();
        formData.append("file", file);
        return axios.post(`http://${host}/api/file`, formData, {
            cancelToken: new CancelToken(function executor(c) {
                cancelFn = c;
            }),
            onUploadProgress: (progressEvent) => {
                let rate = ((progressEvent.loaded / progressEvent.total) * 100) | 0;

                // 更新进度窗口信息
                ipcRenderer.send("progress-data", { rate, message: `传输中...` });
            },
        });
    }

    ipcRenderer.on("cancel-post", () => {
        cancelFn && cancelFn();
        ipcRenderer.send("hide-progress-page");
    });

    ipcRenderer.on("get-hostname-reply", (e, data) => {
        hostname = data;
    });

    // 设备信息监听
    ipcRenderer.on("devices-info-reply", (e, data) => {
        if (data.type === "all") {
            oHostSelect.innerHTML = "";
        }

        data.devices.forEach((device, index) => {
            const oDeviceOption = document.createElement("option");
            oDeviceOption.value = device.ip;
            oDeviceOption.textContent = device.hostname + ":" + device.ip;
            oHostSelect.appendChild(oDeviceOption);
        });
    });

    //添加拖拽事件监听器
    oDragWrap.addEventListener("drop", (e) => {
        //阻止默认行为
        e.preventDefault();
        //获取文件列表
        const files = e.dataTransfer.files;

        if (files.length > 1) {
            showErrorAlert("文件错误", "无法上传多个文件");
            return;
        }

        const file = files[0];

        fs.stat(file.path, function (err, data) {
            if (data.isDirectory()) {
                showErrorAlert("文件错误", "无法上传文件夹");
            } else {
                oFileName.textContent = file.name;
                oFileUrl.textContent = file.path;
                uploadFile = file;
            }
        });
    });
    //阻止拖拽结束事件默认行为
    oDragWrap.addEventListener("dragover", (e) => {
        e.preventDefault();
    });

    // 点击按钮选择文件方式
    document.querySelector(".select-btn").addEventListener("click", () => {
        oFileInput.click();
    });
    oFileInput.addEventListener("change", () => {
        const files = oFileInput.files;
        if (files && files.length > 0) {
            const file = files[0];
            uploadFile = file;
            oFileName.innerHTML = file.name;
            oFileUrl.innerHTML = file.path;
            oFileInput.value = "";
        }
    });

    // 关闭窗口按钮点击事件
    document.querySelector(".close-btn").addEventListener("click", () => {
        ipcRenderer.send("hide-main-page");
    });

    // 清空按钮点击事件
    document.querySelector(".clear-btn").addEventListener("click", () => {
        clear();
    });

    // 刷新按钮点击事件
    document.querySelector(".refresh-btn").addEventListener("click", () => {
        ipcRenderer.send("refresh-devices-req");
    });

    // 设置按钮点击事件
    document.querySelector(".setting-btn").addEventListener("click", () => {
        ipcRenderer.send("open-setting-page");
    });

    // 读取文件为dataURL
    function fileToDataURL(file, cb) {
        const reader = new FileReader();
        reader.readAsDataURL(file); // input.files[0]为第一个文件
        reader.onload = () => {
            cb(reader.result);
        };
        reader.onerror = () => {
            showErrorAlert("文件错误", "文件解析出现错误");
        };
    }

    // 显示错误alert
    function showErrorAlert(title, content) {
        ipcRenderer.send("show-error", { title, content });
    }

    // 清除文件
    function clear() {
        oFileName.innerHTML = "未选择文件";
        oFileUrl.innerHTML = "未选择文件";
        uploadFile = null;
    }
}