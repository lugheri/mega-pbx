import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

export default {
    dest: path.resolve(__dirname, '..', '..', 'tmp', 'files'),
    storage: multer.diskStorage({
        destination: (req, file, callback) => {
            callback(null, path.resolve(__dirname, '..', '..', 'tmp', 'files'));
        },
        filename: (req, file, callback) => {
            crypto.randomBytes(16, (err, hash)=>{
                if(err) callback(err);

                const filename = `${hash.toString('hex')}-${file.originalname}`;

                callback(null, filename);
            });
        },
    }),
    limits:{
        fileSize: 2000 * 1024 * 1024
    },
    fileFilters:(req,file,callback) =>{
        const allowedMimes = [
            'text/csv'
        ]
        if(allowedMimes.includes(file.mimetype)){
            callback(null,true)
        }else{
            callback(new Error('Invalid file type.'))
        }
    }    
};