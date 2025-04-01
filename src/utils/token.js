const jwt = require('jsonwebtoken');

const generarToken = (user, recordarDisp) => {
    // Verifica que las claves secretas estén configuradas
    if (!process.env.SECRET_KEY || !process.env.SECRET_KEY_PERMANENTE) {
        throw new Error("Las claves secretas no están configuradas");
    }

    const tempToken = jwt.sign(
        { id: user._id, usuario: user.usuario },
        process.env.SECRET_KEY,
        { expiresIn: '1h' } // Expira en 1 hora
    );

    let tokenPermanente = null;
    if (recordarDisp) {
        tokenPermanente = jwt.sign(
            { id: user._id, usuario: user.usuario },
            process.env.SECRET_KEY_PERMANENTE,
            { expiresIn: '30d' } // Expira en 30 días
        );
    }

    return { tempToken, tokenPermanente };
};

module.exports = {generarToken};