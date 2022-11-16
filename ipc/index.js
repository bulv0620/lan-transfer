const { ipcMain, dialog } = require('electron');

class AppIpc {
    constructor(mainPageInstance, progressPageInstance, settingPageInstance, server) {
        this.mainPageInstance = mainPageInstance
        this.progressPageInstance = progressPageInstance
        this.settingPageInstance = settingPageInstance
        this.server = server

        this.loading = false
    }

    create() {
        // hide main
        ipcMain.on('hide-main-page', () => {
            this.hideWindow(this.mainPageInstance)
        })

        // online devices verify
        ipcMain.on('online-verify-req', async () => {
            await this.server.onlineVerify();
            this.mainPageInstance.webContents.send('devices-info-reply', {
                type: 'all',
                devices: this.server.devices
            });
        })

        // refresh devices
        ipcMain.on('refresh-devices-req', async () => {
            if (this.loading) {
                dialog.showMessageBoxSync(this.mainPageInstance, {
                    type: 'error',
                    message: '请勿重复点击刷新按钮',
                    title: 'error'
                })
            }
            else {
                this.loading = true;
                await this.server.getDevices()
                this.mainPageInstance.webContents.send('devices-info-reply', {
                    type: 'all',
                    devices: this.server.devices
                });
                this.loading = false
            }
        })

        // get hostname
        ipcMain.on('get-hostname-req', (e) => {
            e.reply('get-hostname-reply', this.server.hostname)
        })

        // cancel post
        ipcMain.on('cancel-post-req', () => {
            this.mainPageInstance.webContents.send('cancel-post')
        })

        // open progress
        ipcMain.on('open-progress-page', () => {
            if (!this.progressPageInstance.isVisible()) {
                const { x, y } = this.mainPageInstance.getBounds()
                this.progressPageInstance.setBounds({ x: x - 45, y: y + 115 })
                this.progressPageInstance.show()
                // this.progressPageInstance.webContents.openDevTools();
            }
        })

        // hide progress
        ipcMain.on('hide-progress-page', () => {
            this.hideWindow(this.progressPageInstance)
        })

        // delever progress data
        ipcMain.on('progress-data', (e, data) => {
            this.progressPageInstance.webContents.send('progress-data', { message: data.message, rate: data.rate })
        })

        // open setting
        ipcMain.on('open-setting-page', () => {
            if (!this.settingPageInstance.isVisible()) {
                const { x, y } = this.mainPageInstance.getBounds()
                this.settingPageInstance.setBounds({ x: x - 45, y: y + 60 });
                this.settingPageInstance.show()
            }

            this.settingPageInstance.webContents.send('user-info-reply', {
                name: this.server.hostname,
                path: this.server.path
            })
        })

        // close setting
        ipcMain.on('hide-setting-page', () => {
            this.hideWindow(this.settingPageInstance)
        })

        // select folder dialog
        ipcMain.on('select-folder-req', async (e) => {
            const res = await dialog.showOpenDialog({ properties: ['openDirectory'] })

            if (!res.canceled) {
                e.reply('select-folder-reply', res.filePaths[0])
            }
        })

        // save host info
        ipcMain.on('save-info-req', () => {
            this.server.setName(data.name)
            this.server.setPath(data.path)
            this.hideWindow(this.settingPageInstance)
        })

        // show error
        ipcMain.on('show-error', (e, data) => {
            dialog.showMessageBoxSync(this.mainPageInstance, {
                type: 'error',
                message: data.content,
                title: data.title
            })
        })
    }

    hideWindow(windowInstance) {
        if (windowInstance.isVisible()) {
            windowInstance.hide();
        }
    }
}

module.exports = AppIpc