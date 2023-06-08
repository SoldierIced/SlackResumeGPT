require('dotenv').config();
const fs = require('fs');
const path = require('path');




module.exports = {
    response(data, status = 'success', hash = '') {
        return { status: status, response: data, hash: hash };
    },
    
    async saveFile(nameFile,content,folder="Summaries"){
        const directoryPath = path.join(__dirname.replace("\src",""), folder);
     
        fs.writeFile(folder + "/"+ nameFile,content , 'utf8', function (err) {
            if (err) {
                console.log("An error occured while writing JSON Object to File.");
                return console.log(err);
            }
            console.log("JSON file has been saved.");
        });
    },
    async getNameFiles(folder="Summaries"){
        const directoryPath = path.join(__dirname.replace("\src",""), folder);
        let files = await fs.readdirSync(directoryPath);
        return files;
    },
    async getFile(namefile,folder="Summaries"){
        const directoryPath = path.join(__dirname.replace("\src",""), folder,namefile);
        let file = await fs.readFileSync(directoryPath, 'utf8');
        return file;
    },
    


}