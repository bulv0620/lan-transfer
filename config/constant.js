const path = require('path')

module.exports = {
    DESIGN_MAIN_WIDTH: 360,
    DESIGN_MAIN_HEIGHT: 360,

    DESIGN_SETTING_WIDTH: 450,
    DESIGN_SETTING_HEIGHT: 235,

    DESIGN_PROGRESS_WIDTH: 450,
    DESIGN_PROGRESS_HEIGHT: 116,

    BASE_WIN_WIDTH: 1920,
    BASE_WIN_HEIGHT: 1080,

    WIN_DEFAULT_CONFIG: {
        show: false,
        frame: false,
        focusable: true,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        icon: path.join(__dirname, '../favicon.ico')
    }

}