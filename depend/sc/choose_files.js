// Let user choose files and pass their content to callback
// linter: ngspicejs-lint --browser
// global:
"use strict";

var SC = window.SC || {};

SC.chooseFiles = function (aCallbackFiles, aAllowedExtensions, aSingleFile, aReadAsDataURL) {
    // Let user choose files and pass their content to callback
    // aMime = image/png
    var form, input, doneFiles = [];

    // input
    form = document.createElement('form');
    form.method = 'post';
    input = document.createElement('input');
    input.type = 'file';
    if (aAllowedExtensions) {
        input.accept = aAllowedExtensions;
    }
    input.multiple = !aSingleFile;
    input.required = true;
    input.style.display = 'block';
    input.style.border = '1px solid red';
    input.style.boxSizing = 'border-box';
    input.style.width = '100%';

    function readerOnLoad(event) {
        // single file loaded
        event.target.myFile.data = event.target.result;
        doneFiles.push(event.target.myFile);
        if ((event.loaded === event.total) && (doneFiles.length === event.target.myCount)) {
            if (aCallbackFiles) {
                if (input.parentElement) {
                    input.parentElement.removeChild(input);
                }
                aCallbackFiles(doneFiles);
            }
            doneFiles = [];
        }
    }

    input.addEventListener('change', function (event) {
        // process files
        var i, reader, file, files;
        files = event.target.files;
        for (i = 0; i < files.length; i++) {
            file = files[i];
            // read each file content
            reader = new FileReader();
            reader.addEventListener("load", readerOnLoad);
            reader.myFile = file;
            reader.myName = file.name;
            reader.myCount = files.length;
            if (aReadAsDataURL) {
                reader.readAsDataURL(file);
            } else {
                if (aAllowedExtensions === '.json') {
                    reader.readAsText(file);
                } else {
                    reader.readAsBinaryString(file);
                }
            }
        }
    });

    // add input to form and click on it to start
    form.appendChild(input);
    input.click();
};

