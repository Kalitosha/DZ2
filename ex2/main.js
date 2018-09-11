const process = require('process');
const fs = require('fs');
const path = require('path');

const remFlag = '-d';

let sourceDir = process.argv[2] || './dir_1';  // [2] путь к исходной папке = sourceDir
let finalDir = process.argv[3] || './collection'; // [3] путь к итоговой папке = finalDir
const dirDelete = process.argv[4]; // [4] необходимость удаления исходной = dirDelete (-d)

try { fs.stat(process.argv[2]); } catch (e) {sourceDir = './dir_1';}
try { fs.stat(process.argv[3]); } catch (e) {finalDir = './collection';}

let arrDirPaths = [];
arrDirPaths.push(sourceDir);

/***********************************************************************/
function doIt() {
    return new Promise(function(resolve, reject)
    {
        console.log('then recursiveWalk');
        fs.mkdir(finalDir , function (err) { //создаем общую папку
            if (err) {
                if (err.code === 'EEXIST'){
                    console.log(`Directory \'${finalDir}\' has already exist`);
                    resolve( recursiveWalk(sourceDir, [], [], 'f') );}
                else {console.log('mkdir finalDir:', err); reject();}
            } else{
                console.log(`Directory \"${finalDir}\" created successfully!`);
                resolve( recursiveWalk(sourceDir, [], [], 'f') );
            }
        });
    });
}

doIt()
.then(async function( arrFilePaths){ // тут нужно создать папку
    console.log('then createDir');
    for (let i = 0; i < arrFilePaths.length; i++) {
        await createDir(arrFilePaths[i]);
    }
    return arrFilePaths;
})
.then(async function(arrFilePaths){ // тут нужно скопировать файлы
    console.log('then copyFile');
        for (let i = 0; i < arrFilePaths.length; i++) {
            await fileCopy(arrFilePaths[i]);
        }
})
.then(function(){ // если есть флаг - обходим всю папку
    console.log('then removeDirRecursive');
    if (dirDelete === remFlag) {
        return recursiveWalk(sourceDir, [], arrDirPaths, 'fd');
    }
})
.then(function(arrElems) {
    console.log('then removeDir');
    if (dirDelete === remFlag) {
        let arrDirPaths = [];
        arrElems.forEach((elem) => {
            let stat = fs.statSync(elem); // statSync=синхрон. вытаскиваем инфу по адресу пути(текущем объекте)
            if (stat.isFile()) { // проверяем явл-ся ли он файлом
                removeFile(elem);
            }
            else if (stat.isDirectory()) { // иначе это папка
                arrDirPaths.push(elem);
            }
        });
        removeDir(arrDirPaths);
    }
})
.catch(function(err){
    console.log(err); //выведет сообщение из reject
});

function recursiveWalk(currentDirPath, arrFilePaths, arrDirPaths, param) { // обход дерева в ширину
    try {
        fs.readdirSync(currentDirPath).forEach(file => {
            let elemPath = path.join(currentDirPath, file); // делаем корретный URL
            let stat = fs.statSync(elemPath); // statSync=синхрон. вытаскиваем инфу по адресу пути(текущем объекте)
            if (stat.isFile()) { // проверяем явл-ся ли он файлом
                arrFilePaths.push(elemPath);
            }
            else if (stat.isDirectory()) { // иначе это папка
                arrDirPaths.push(elemPath);
                return recursiveWalk(elemPath, arrFilePaths, arrDirPaths, param); // спускаемся ниже и повторяем
            }
        });
    }catch (err) {
        console.log('recursiveWalk ', err);
        return err;
    }
    if (currentDirPath === sourceDir){
        if (param === 'f')
            return arrFilePaths;
        else if (param === 'fd'){
            return arrFilePaths.concat(arrDirPaths);
        }
    }
}

function createDir(filePath) {
    return new Promise((resolve, reject) => {
        let dirPath = getDirPath(filePath);
        fs.stat(dirPath, function (err, stat) {
            if (err){
                if(err.code === 'ENOENT') { // папка еще не существует
                    fs.mkdir(dirPath, function (err) { //создаем папку с литерой
                        if (!err) {// console.log(dirPath + " created successfully!");
                            resolve();
                        }
                        else if (err.code === 'EEXIST'){
                            resolve(); //console.log(dirPath, ': has already exist');
                        }
                        reject();
                    });
                }else{
                    console.log('createDir: ', err);
                    reject();
                }
            } else
                resolve();
        });
    })
}

function fileCopy(filePath) {
    return new Promise((resolve, reject) => {
        let dirPath = getDirPath(filePath);
        fs.stat(dirPath, (err) => {
            if(err) {
                console.log('fileCopy.stat: ', err.message);
            }
            fs.copyFile(filePath, path.join(getDirPath(filePath), getFileName(filePath)), (err) => { // copyFile(что, куда)
                if (err) {
                    console.log('fileCopy: ', err.code);
                    reject();
                }
                resolve();
            });
        });
    });
}

function getDirPath(filePath) {
    let fName = getFileName(filePath); // вытаскиваем имя файла из пути
    let firstLetter = fName.charAt(0).toUpperCase();
    return path.join(finalDir, firstLetter); // делаем корректный URL
}

function getFileName(filePath) {
    return path.basename(filePath);
}

function removeFile(filePath) {
    return new Promise((resolve, reject) => {
        fs.unlink(filePath, function (err) {
            if (!err){
                resolve();
            }else if (err && err.code === 'ENOENT') {// file doesn't exist
                console.log(filePath + " doesn't exist");
                reject(); // todo тут надо reject или resolve?
            } else if (err) { // other errors
                console.log('removeFile: ', err.message);
                reject();
            }
        });
    });
}

function removeDir(arrDirPaths){
    for (let i = arrDirPaths.length - 1; i >= 0; i--) {
        try{
            fs.rmdirSync(arrDirPaths[i]);
        }
        catch (e) {
            console.log('removeDir: ', e);
        }
    }
}