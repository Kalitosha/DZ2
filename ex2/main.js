const process = require('process');
const util = require('util');
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
fs.mkdir(finalDir , function (err) { //создаем общую папку
    if (err) {
        if (err === 'EEXIST') console.log('dir has already exist');
        else {}//console.error(err);
    } else{
        // console.log(`Directory \"${finalDir}\" created successfully!`);
    }
});

let arrFilePathsProm = [];
function doIt() {
    return new Promise(function(resolve, reject)
    {
        let arrFilePaths = recursiveWalk(sourceDir, []);
        arrFilePathsProm = arrFilePaths.map(el => { // todo это не получается
            return request.get(el);
        });
        resolve( arrFilePathsProm ); // а дальше нужно создать папку и копировать файл
    });
}

doIt()
.all(arrFilePathsProm) //(arrFilePathsProm.map(item => item.catch(err => err))) // todo это не получается
.then(function(result) // arrFilePaths here
{ // тут нужно создать папку и копировать файл
    console.log('arr:', result);
    let arrFilePaths = result;
    arrFilePaths.forEach((item) => {
        createDir(item);
        return item;
    });
    // console.log(result); //выведет сообщение из resolve
})
.then(function(result) // filePath here
{ // тут нужно скопировать файлы
    let filePath = result;
    let dirPath = getDirPath(filePath);
    movingFile(filePath, dirPath);
})
.then(function() // filePath here
{
    if (dirDelete === remFlag) {
        removeDirRecursive(sourceDir, arrDirPaths);
    }
})
.then(function() // filePath here
{
    removeDir();
})
.catch(function(err){
    console.log(err); //выведет сообщение из reject
});

/***********************************************************************/
/***********************************************************************/
// это старая функция
// function doIt() {
//     fs.mkdir(finalDir , function (err) { //создаем общую папку
//         if (err) {
//             if (err === 'EEXIST') console.log('dir has already exist');
//             else return 1; //console.error(err);
//         } else{
//             // console.log(`Directory \"${finalDir}\" created successfully!`);
//         }
//     });
//
//     recursiveWalk(sourceDir, function (arrFilePaths) {
//         // нужно создать папку и копировать файл
//         for(let i=0; i<arrFilePaths.length; i++) {
//             createDir(arrFilePaths[i], function (){} );
//         }
//     });
// }
/********************************************************************************************/
/********************************************************************************************/
function recursiveWalk(currentDirPath, arrFilePaths) { // обход дерева в ширину
    try {
        fs.readdirSync(currentDirPath).forEach(file => {
        let elemPath = path.join(currentDirPath, file); // делаем корретный URL
            let stat = fs.statSync(elemPath); // statSync=синхрон. вытаскиваем инфу по адресу пути(текущем объекте)
            if (stat.isFile()) { // проверяем явл-ся ли он файлом
                arrFilePaths.push(elemPath);
            }
            else if (stat.isDirectory()) { // иначе это папка
                return recursiveWalk(elemPath, arrFilePaths); // спускаемся ниже и повторяем
            }
        });
    }catch (err) {
        console.log('recursiveWalk ', err);
        return err;
    }
    if (currentDirPath === sourceDir){
        return arrFilePaths;
        // console.log('recursiveWalk: ', arrFilePaths);
    }
}
/********************************************************************************************/
/********************************************************************************************/
// function recursiveWalk(currentDirPath, callback) { // обход дерева в ширину
//     let arrFilePaths = [];
//     fs.readdir(currentDirPath, function (err, files) { // readdir=асинхрон. Считывает содержимое каталога.
//         if (err) {
//             return err;
//         }
//         files.forEach(function (elName) {
//             let elemPath = path.join(currentDirPath, elName); // делаем корретный URL
//             try {
//                 let stat = fs.statSync(elemPath); // statSync=синхрон. вытаскиваем инфу по адресу пути(текущем объекте)
//                 if (stat.isFile()) { // проверяем явл-ся ли он файлом
//                     arrFilePaths.push(elemPath);
//                 }
//                 else if (stat.isDirectory()) { // иначе это папка
//                     return recursiveWalk(elemPath, callback); // спускаемся ниже и повторяем
//                 }
//             } catch (err) {
//                 console.log('recursiveWalk ', err.message);
//                 return err;
//             }
//         });
//         if (arrFilePaths.length!==0)
//             callback(arrFilePaths);
//         // console.log('recursiveWalk: ', arrFilePaths);
//         // return  arrFilePaths;
//     });
// }
/********************************************************************************************/
/********************************************************************************************/
function createDir(filePath) {
    let dirPath = getDirPath(filePath);

    fs.stat(dirPath, function (err, stat) {
        if (err){
            if(err.code === 'ENOENT') { // папка еще не существует
                fs.mkdir(dirPath, function (err) { //создаем папку с литерой
                    if (err) {
                        if (err.code === 'EEXIST'){}  //console.log(dirPath, ': has already exist');
                        else console.log(dirPath, ':', err.code);
                    }// else console.log(dirPath + " created successfully!");
                });
            }else{
                console.log('createDir: ', err);
            }
        }else if (stat) { // папка уже существует
            //return filePath;
        }
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

function movingFile(filePath, dirPath) {
    if (dirPath!==''){
        fs.copyFile(filePath, dirPath + '/' + getFileName(filePath), (err) => { // copyFile(что, куда)
            if (err) console.log('movingFile: ', err.message); //throw err.message;
            //console.log(getFileName(filePath) + ' was copied');
        });
    }
}
/***********************************************************************/
function removeFile(filePath) {
    return new Promise(resolve => {
        fs.unlink(filePath, function (err) {
            if (err && err.code === 'ENOENT') {// file doesn't exist
                console.log(filePath + " doesn't exist");
            } else if (err) { // other errors
                console.log('removeFile: ', err.message);
            } else {
                //console.log(filePath + ' was removed');
            }
        });
    });
}

async function removeDirRecursive(currentDirPath, arrDirPaths){
    fs.readdir(currentDirPath, function (err, files) { // readdir(асин) - считывает содержимое каталога.
        if (err) {
            // console.log('removeDirRecursive: ', err);
            return err;
        }
        files.forEach( async function (fName) {
            let filePath = path.join(currentDirPath, fName); // делаем корретный URL
            try {
                let stat = fs.statSync(filePath); // statSync=синхрон. вытаскиваем инфу по адресу пути(текущем объекте)
                if (stat.isFile()) { // проверяем явл-ся ли он файлом
                    await removeFile(filePath);
                    return 0;
                }
                else if (stat.isDirectory()) { // иначе это папка
                    arrDirPaths.push(filePath);
                    //console.log('before ', filePath);
                    return removeDirRecursive(filePath, arrDirPaths); // спускаемся ниже и повторяем
                }
            } catch (err) {
                //console.log('removeDirRecursive: ', err.message);
                return err;
            }
        });
    });
}

function removeDir(){
    for (let i = arrDirPaths.length - 1; i >= 0; i--) {
        // console.log("arrDirPaths[", i, '] =', arrDirPaths[i]);
        try{
            fs.rmdirSync(arrDirPaths[i]);
        }
        catch (e) {
            return e;
            //console.log('callback removeDirRecursive: ', e.message);
        }
    }
}