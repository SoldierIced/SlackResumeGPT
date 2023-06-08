require('dotenv').config();


class Functions{
    static response(data, status = 'success', hash = '') {
        return { status: status, response: data, hash: hash };
    }
}

module.exports = Functions