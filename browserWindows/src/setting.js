window.onload = function () {
    const { ipcRenderer } = require("electron");
    const oNameInput = document.querySelector('#name');
    const oPathInput = document.querySelector('#filePath');


    document.querySelector(".cancel-btn").addEventListener('click', closeSettingPage);

    document.querySelector('.close-btn').addEventListener('click', closeSettingPage);


    function closeSettingPage() {
        ipcRenderer.send('hide-setting-page');
    }

    ipcRenderer.on('user-info-reply', (e, data) => {
        oNameInput.value = data.name;
        oPathInput.value = data.path;
    })

    ipcRenderer.on('select-folder-reply', (e, data) => {
        oPathInput.value = data;
    })

    oPathInput.addEventListener('click', () => {
        ipcRenderer.send('select-folder-req');
    })

    document.querySelector('.save-btn').addEventListener('click', () => {
        ipcRenderer.send('save-info-req', {
            name: oNameInput.value,
            path: oPathInput.value
        })
    })
}