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
// let arrFilePathsProm = [];
function doIt() {
    return new Promise(function(resolve, reject)
    {
        console.log('then recursiveWalk');
        fs.mkdir(finalDir , function (err) { //создаем общую папку
            if (err) {
                if (err.code === 'EEXIST'){
                    console.log(`Directory \'${finalDir}\' has already exist`);
                    resolve( recursiveWalk(sourceDir, [], [], 'f') );}
                else {console.log('mkdir finalDir:', err);}
            } else{
                console.log(`Directory \"${finalDir}\" created successfully!`);
                resolve( recursiveWalk(sourceDir, [], [], 'f') );
            }
        });
        // let arrFilePaths = recursiveWalk(sourceDir, []);
        // arrFilePathsProm = arrFilePaths.map(el => { //надо сделать массив промисов // todo это не получается
        //     // return request.get(el); // тут надо как-то превратить стринг в промис
        // });
        // resolve( arrFilePaths ); // а дальше нужно создать папку и копировать файл
    });
}

doIt()
// Promise.all(arrFilePathsProm) //(arrFilePathsProm.map(item => item.catch(err => err))) // todo это тоже не получается
.then(function(arrFilePaths)
{ // тут нужно создать папку
    // console.log('arr:', arrFilePaths);
    console.log('then createDir');
    arrFilePaths.forEach((filePath) => {
        createDir(filePath);
    });
    return arrFilePaths;
})
.then(function(arrFilePaths)
{ // тут нужно скопировать файлы
    // console.log('arr:', arrFilePaths);
    console.log('then copyFile');
    arrFilePaths.forEach((filePath) => {
        fs.copyFile(filePath, path.join(getDirPath(filePath), getFileName(filePath)), (err) => { // copyFile(что, куда)
            if (err){console.log('movingFile: ', err.message);}
        });
    });
})
.then(function()
{
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

/********************************************************************************************/
/********************************************************************************************/
// async function removeDirRecursive(currentDirPath, arrDirPaths){
//     fs.readdir(currentDirPath, function (err, files) { // readdir(асин) - считывает содержимое каталога.
//         if (err) {
//             // console.log('removeDirRecursive: ', err);
//             return err;
//         }
//         files.forEach( async function (fName) {
//             let filePath = path.join(currentDirPath, fName); // делаем корретный URL
//             try {
//                 let stat = fs.statSync(filePath); // statSync=синхрон. вытаскиваем инфу по адресу пути(текущем объекте)
//                 if (stat.isFile()) { // проверяем явл-ся ли он файлом
//                     await removeFile(filePath);
//                     return 0;
//                 }
//                 else if (stat.isDirectory()) { // иначе это папка
//                     arrDirPaths.push(filePath);
//                     //console.log('before ', filePath);
//                     return removeDirRecursive(filePath, arrDirPaths); // спускаемся ниже и повторяем
//                 }
//             } catch (err) {
//                 //console.log('removeDirRecursive: ', err.message);
//                 return err;
//             }
//         });
//     });
// }
/********************************************************************************************/
/********************************************************************************************/
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