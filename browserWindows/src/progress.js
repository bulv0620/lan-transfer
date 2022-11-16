window.onload = function () {
    const { ipcRenderer } = require("electron");

    const oProgress = document.querySelector(".bar"); // 进度条 设置style.width的百分比
    const oText = document.querySelector(".text"); // 文本信息 设置textContent
    const oRate = document.querySelector(".rate"); // 进度信息 设置textContent

    ipcRenderer.on("progress-data", (e, data) => {
        oText.textContent = data.message;
        oRate.textContent = data.rate + "%";
        oProgress.style.width = data.rate + "%";
    });

    // 中断传输按钮
    document.querySelector(".close-btn").addEventListener("click", () => {
        oText.textContent = "传输中断";
        ipcRenderer.send("cancel-post-req");
    });
}