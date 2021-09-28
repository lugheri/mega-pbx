"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _multer = require('multer'); var _multer2 = _interopRequireDefault(_multer);
var _path = require('path'); var _path2 = _interopRequireDefault(_path);
var _crypto = require('crypto'); var _crypto2 = _interopRequireDefault(_crypto);

exports. default = {
    dest: _path2.default.resolve(__dirname,  '..', '..', 'tmp', 'images'),
    storage: _multer2.default.diskStorage({
        destination: (req, file, callback) => {
            callback(null, _path2.default.resolve(__dirname,  '..', '..', 'tmp', 'images'));
        },
        filename: (req, file, callback) => {
            _crypto2.default.randomBytes(16, (err, hash)=>{
                if(err) callback(err);

                const filename = `${hash.toString('hex')}-${file.originalname}`;

                callback(null, filename);
            });
        },
    }),
    limits:{
        fileSize: 40 * 1024 * 1024
    },
    fileFilters:(req,file,callback) =>{
        const allowedMimes = [
            'image/jpeg',
            'image/pjpeg',
            'image/png',
            'image/gif'
        ]
        if(allowedMimes.includes(file.mimetype)){
            callback(null,true)
        }else{
            callback(new Error('Invalid file type.'))
        }
    }    
}