import fs from "fs";
import moment from 'moment';

class logs{
    logErrors(err, req, res, next) {
        const logger = fs.createWriteStream('log_errors.txt', {
            flags: 'a' // 'a' means appending (old data will be preserved)
        })
        logger.write(`logError ${err.stack}`)

        console.error('Error->',err.stack);
        logger.end()
        next(err);
    }
    
    clientErrorHandler(err, req, res, next) {
        if (req.xhr) {
          res.status(500).send({ error: 'Something failed!' });
        } else {
          next(err);
        }
    }

    errorHandler(err, req, res, next) {
        res.status(500);
        res.render('error', { error: err });
    }

    saveLog(value){
        const hoje = moment().format("YYYY-MM-DD")
        const hora = moment().format("HH:mm:ss")

        const logger = fs.createWriteStream('log.txt', {
            flags: 'a' // 'a' means appending (old data will be preserved)
        })
        logger.write(`${hoje} ${hora} - ${value} \n`)
        logger.end()
        return true
    }
}

export default new logs()