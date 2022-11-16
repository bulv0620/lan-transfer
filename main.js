const Server = require('./common/server/server')
const { app, Menu, Tray, dialog, BrowserWindow } = require('electron')
const { deleteFiles } = require('./common/utils/fileUtiles')
const path = require('path')
const { portIsOccupied } = require('./common/utils/netUtils')
const { WIN_DEFAULT_CONFIG, DESIGN_MAIN_WIDTH, DESIGN_MAIN_HEIGHT, DESIGN_PROGRESS_HEIGHT, DESIGN_PROGRESS_WIDTH, DESIGN_SETTING_WIDTH, DESIGN_SETTING_HEIGHT } = require('./config/constant')
const AppIpc = require('./ipc')

let server
let mainPage
let settingPage
let progressPage

app.on('ready', async () => {
    try {
        await portIsOccupied(54188)
        server = new Server(54188)
        await server.getDevices()

        mainPage = new BrowserWindow(Object.assign({}, WIN_DEFAULT_CONFIG, {
            width: DESIGN_MAIN_WIDTH,
            height: DESIGN_MAIN_HEIGHT
        }))
        mainPage.loadFile('./browserWindows/static/views/main.html')
        mainPage.once('ready-to-show', () => {
            mainPage.webContents.send('devices-info-reply', {
                type: 'all',
                devices: server.devices
            });
            mainPage.show()
        })

        settingPage = new BrowserWindow(Object.assign({}, WIN_DEFAULT_CONFIG, {
            parent: mainPage,
            modal: true,
            width: DESIGN_SETTING_WIDTH,
            height: DESIGN_SETTING_HEIGHT
        }))
        settingPage.loadFile('./browserWindows/static/views/setting.html')

        progressPage = new BrowserWindow(Object.assign({}, WIN_DEFAULT_CONFIG, {
            parent: mainPage,
            modal: true,
            width: DESIGN_PROGRESS_WIDTH,
            height: DESIGN_PROGRESS_HEIGHT
        }))
        progressPage.loadFile('./browserWindows/static/views/progress.html')

        createTray()
        const appIpc = new AppIpc(mainPage, progressPage, settingPage, server)
        appIpc.create() 

        server.on('new-device', (data) => {
            mainPage.webContents.send('devices-info-reply', {
                type: 'add',
                devices: [data]
            })
        })

        app.on('before-quit', () => {
            deleteFiles(server.temp);
        })
    } catch (error) {
        dialog.showMessageBoxSync(win, {
            type: 'error',
            message: error.message,
            title: 'init error'
        })
        app.quit();
    }
})

function createTray() {
    let tray = new Tray(path.resolve(__dirname, './favicon.ico'))
    const contextMenu = Menu.buildFromTemplate([
        {
            label: '打开',
            click: () => {
                verifyDevices()
                mainPage.show()
            }
        },
        {
            label: '设置',
            click: () => {
                if (!settingPage.isVisible()) {
                    const { x, y } = mainPage.getBounds()
                    settingPage.setBounds({ x: x - 45, y: y + 60 });
                    settingPage.show()
                }

                settingPage.webContents.send('user-info-reply', {
                    name: server.hostname,
                    path: server.path
                })
            }
        },
        {
            label: '退出',
            click: () => {
                app.quit()
            }
        }
    ])
    tray.setToolTip('WIFI快传')
    tray.setContextMenu(contextMenu)
    tray.addListener('double-click', () => {
        verifyDevices()
        mainPage.show()
    })
}

async function verifyDevices() {
    await server.onlineVerify()
    mainPage.webContents.send('post-devices', {
        type: 'all',
        devices: server.devices
    })
}