import connect from '../Config/dbConnection';
class User{
    findUser(usuario,callbak){
        const sql = `SELECT * FROM users WHERE usuario='${usuario}' AND status=1`;
        connect.query(sql, usuario, callbak)
    }

}

export default new User;