var Jimp = require("jimp");
var QrCode = require('qrcode-reader');
var fs = require("fs");
var file_no = 0;
//var port = process.env.port || 1337;
var FileList = [];
var obj = { dev: "/dev.json", test: "/test.json", prod: "/prod.json" };
var configs = {};
var MultiMap = require("collections/multi-map");
var Dict = require("collections/dict");
var SortedSet = require("collections/sorted-set");
var SortedArray = require("collections/sorted-array");
var List = require("collections/list");
var final_solutions = {};
var solution = {};
var FileDic = new Dict();
//processFiles(FileDic);
function decode_file(filename) {
    var buffer = fs.readFileSync(__dirname + '/extracted/' + filename);
    Jimp.read(buffer, function (err, image) {
        if (err) {
            console.error(err);
            // TODO handle error
        }
        var qr = new QrCode();
        qr.callback = function (err, value) {
            if (err) {
                console.error(err);
                // TODO handle error
            }
            FileDic.add(filename, value.result);
            processFiles(FileDic);
        };
        qr.decode(image.bitmap);
    });
}
function processFiles(FileDic) {
    var i = 0;
    FileDic.forEach(function (array, key) {
        var list_trans = key.split(" ").map(parseFloat);
        var obj = {};
        for (var i = 0; i < list_trans.length; i++) {
            if (typeof obj[list_trans[i]] == "undefined") {
                obj[list_trans[i].toFixed(2)] = [];
                obj[list_trans[i].toFixed(2)].push(i);
            }
            else {
                obj[list_trans[i].toFixed(2)].push(i);
            }
        }
        var sortedMin = new SortedSet(list_trans, function (a, b) {
            return parseFloat(a).toFixed(2) == parseFloat(b).toFixed(2);
        }, function (a, b) {
            return -(a - b);
        });
        var sortedMax = new SortedSet(list_trans, function (a, b) {
            return parseFloat(a).toFixed(2) == parseFloat(b).toFixed(2);
        }, function (a, b) {
            return a - b;
        });
        while (1) {
            var tentative_min = sortedMin.pop();
            var tentative_max = sortedMax.pop();
            var min_list = obj[tentative_min.toFixed(2)];
            var max_list = obj[tentative_max.toFixed(2)];
            var sol_min;
            var sol_max;
            for (var _i = 0; _i < min_list.length; _i++) {
                for (var _j = 0; _j < max_list.length; _j++) {
                    if (max_list[_j] > min_list[_i] + 1) {
                        sol_min = tentative_min.toFixed(2);
                        sol_max = tentative_max.toFixed(2);
                        console.log(sol_min);
                        console.log(sol_max);
                        var sol = {};
                        sol['buyPoint'] = sol_min;
                        sol['sellPoint'] = sol_max;
                        solution[array] = sol;
                        break;
                    }
                }
            }
            if (typeof solution[array] != "undefined")
                break;
            sortedMin.push(tentative_min);
        }
    });
}
function readFiles(dirname, res, onContent, onError) {
    fs.readdir(dirname, function (err, filenames) {
        if (err) {
            onError(err);
            return;
        }
        var counter = 0;
        filenames.forEach(function (filename) {
            decode_file(filename);
            counter = counter + 1;
            if (counter == filenames.length) {
                setTimeout(() => {
                    return res.status(200).send(JSON.stringify(solution));
                }, 100);
            }
        });
    });
}
var express = require('express');
var fileUpload = require('express-fileupload');
var app = express();
app.set('port', /*process.env.PORT ||*/ 8000);
// default options
app.use(fileUpload());
app.post('/uploadMultipartFile', function (req, res) {
    if (Object.keys(req.files).length == 0) {
        return res.status(400).send('No files were uploaded.');
    }
    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    let sampleFile = req.files.sampleFile;
    // Use the mv() method to place the file somewhere on your server
    sampleFile.mv('Intel.zip', function (err) {
        if (err)
            return res.status(500).send(err);
        // res.send('File uploaded!');
        var extract = require('extract-zip');
        extract('Intel.zip', { dir: __dirname + '/extracted' }, function (err) {
            // extraction is complete. make sure to handle the err
            console.log("Unzipped succesfully");
            readFiles(__dirname + '/extracted', res, function (res) {
            }, function (err) {
            });
        });
    });
});
var server = app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + server.address().port);
});
//# sourceMappingURL=server.js.map