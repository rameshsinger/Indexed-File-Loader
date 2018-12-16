var IndexedFileLoader = (function () {
    var fileConfigPath = 'indexedLoader.json';
    var configList;
    var pendingFileList = { script: [], style: [] };
    fetch(fileConfigPath).then(response => {
        response.json().then(result => {
            configList = result.fileConfig;
            init();
        });
    }).catch(err => {
        console.error(err);
    });
    /*indexed DB Connector*/
    var dbService = (function () {
        var db;
        var fileStore;
        function getDB() {
            return new Promise((res, rej) => {
                if (!db) {
                    var request = window.indexedDB.open("FileLoaderDB", 1);
                    request.onerror = function (event) {
                        console.log("error: ");
                    };
                    request.onsuccess = function (event) {
                        db = event.target.result;
                        console.log("success: " + db);
                        res(db)
                    };
                    request.onupgradeneeded = function (event) {
                        event.target.result.createObjectStore("fileStore", { keyPath: "id" });
                    }
                } else {
                    res(db);
                }
            });
        }
        function getFile(id) {
            return new Promise((res, rej) => {
                getDB()
                    .then(db => {
                        var transaction = db.transaction(["fileStore"], "readwrite");
                        var fileStore = transaction.objectStore("fileStore");
                        let request = fileStore.get(id);
                        request.onsuccess = function (e) {
                            res(this.result);
                        };
                        request.onerror = function (e) {
                            rej(e);
                        };
                    }).catch(err => {
                        console.error(err);
                    });
            });
        }
        function addFile(id, response, version) {
            getDB().then(db => {
                var request = db.transaction(["fileStore"], "readwrite")
                    .objectStore("fileStore")
                    .put({ id: id, version: version, content: response });
                request.onerror = function (e) {
                    console.error("Can't Insert This File Id " + id, e);
                };
            });
        }
        return {
            getFile: getFile,
            addFile: addFile
        }
    })();
    /**/
    function init() {
        console.log(configList);
        if (configList.scripts) {
            configList.scripts.forEach(script => {
                loadJS(script);
            });
        }
        if (configList.styles) {
            configList.styles.forEach(style => {
                loadCSS(style);
            });
        }
    };
    function loadJS(scriptConfig) {
        dbService.getFile(scriptConfig.key).then(result => {
            if (result) {
                if (result.version === scriptConfig.version) {
                    loadScript(scriptConfig, result.content);
                } else {
                    getFileFromServer(scriptConfig.filePath).then(response => {
                        dbService.addFile(scriptConfig.key, response, scriptConfig.version);
                        loadScript(scriptConfig, response);
                    });
                }
            } else {
                getFileFromServer(scriptConfig.filePath).then(response => {
                    dbService.addFile(scriptConfig.key, response, scriptConfig.version);
                    loadScript(scriptConfig, response);
                });
            }
        });
    }
    function loadCSS(styleConfig) {
        dbService.getFile(styleConfig.key).then(result => {
            if (result) {
                if (result.version === styleConfig.version) {
                    loadStyle(styleConfig, result.content);
                } else {
                    getFileFromServer(styleConfig.filePath).then(response => {
                        dbService.addFile(styleConfig.key, response, styleConfig.version);
                        loadStyle(styleConfig, response);
                    });
                }
            } else {
                getFileFromServer(styleConfig.filePath).then(response => {
                    dbService.addFile(styleConfig.key, response, styleConfig.version);
                    loadStyle(styleConfig, response);
                });
            }
        });
    }
    function getFileFromServer(url) {
        return new Promise((res, rej) => {
            fetch(url, {
                headers: {
                    'Cache-Control': 'no-cache'
                }
            }).then(function (response) {
                res(response.text());
            }).catch(function (error) {
                console.warn('Failed: ' + url, error);
            });
        });
    }
    function insertScript(scriptConfig, response) {
        let el = document.createElement('script');
        el.setAttribute('type', 'text/javascript');
        el.setAttribute('script-id', scriptConfig.key);
        el.text = response;
        document.head.appendChild(el);
        scriptCheckDependant(scriptConfig.key);
    }
    function insertStyle(styleConfig, response) {
        let el = document.createElement('style');
        el.setAttribute('type', 'text/css');
        el.setAttribute('style-id', styleConfig.key);
        el.setAttribute('rel', 'stylesheet');
        if (!!(window.attachEvent && !window.opera)) {
            el.styleSheet.cssText = response;
        } else {
            var styleText = document.createTextNode(response);
            el.appendChild(styleText);
        }
        document.head.appendChild(el);
        styleCheckDependant(styleConfig.key);
    }
    function loadScript(scriptConfig, response) {
        if (scriptConfig.dependent && scriptConfig.dependent.length) {
            let notLoadList = [];
            scriptConfig.dependent.forEach(el => {
                if (!document.head.querySelectorAll('[script-id="' + el + '"]').length) {
                    notLoadList.push(el);
                }
            });
            if (notLoadList.length) {
                pendingFileList.script.push({ dependent: notLoadList, response: response, config: scriptConfig });
            } else {
                insertScript(scriptConfig, response);
            }
        } else {
            insertScript(scriptConfig, response);
        }
    }
    function loadStyle(styleConfig, response) {
        if (styleConfig.dependent && styleConfig.dependent.length) {
            let notLoadList = [];
            styleConfig.dependent.forEach(el => {
                if (!document.head.querySelectorAll('[style-id="' + el + '"]').length) {
                    notLoadList.push(el);
                }
            });
            if (notLoadList.length) {
                pendingFileList.style.push({ dependent: notLoadList, response: response, config: styleConfig });
            } else {
                insertStyle(styleConfig, response);
            }
        } else {
            insertStyle(styleConfig, response);
        }
    }
    function scriptCheckDependant(jsId) {
        if (pendingFileList.script.length) {
            let i = pendingFileList.script.length;
            while (i--) {
                let el = pendingFileList.script[i];
                let index = el.dependent.indexOf(jsId);
                if (index !== -1) el.dependent.splice(index, 1);
                if (!el.dependent.length) {
                    pendingFileList.script.splice(i, 1);
                    insertScript(el.config, el.response);
                }
            }
        }
    }
    function styleCheckDependant(cssId) {
        if (pendingFileList.style.length) {
            let i = pendingFileList.style.length;
            while (i--) {
                let el = pendingFileList.style[i];
                let index = el.dependent.indexOf(cssId);
                if (index !== -1) el.dependent.splice(index, 1);
                if (!el.dependent.length) {
                    pendingFileList.style.splice(i, 1);
                    insertStyle(el.config, el.response);
                }
            }
        }
    }
})();