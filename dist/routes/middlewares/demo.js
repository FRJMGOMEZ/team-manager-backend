"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDemo = void 0;
exports.checkDemo = (req, res, next) => {
    if (req.body.user) {
        if (req.body.user.userDb) {
            if (req.body.user.userDb.email === 'frjmartinezgomez@gmail.com') {
                next();
            }
            else {
                if (process.env.DEMO) {
                    return res.status(403).json({ ok: false, message: 'Función no habilitada en la versión DEMO' });
                }
                else {
                    next();
                }
            }
        }
    }
    else {
        if (process.env.DEMO) {
            return res.status(403).json({ ok: false, message: 'Función no habilitada en la versión DEMO' });
        }
        else {
            next();
        }
    }
};
module.exports = { checkDemo: exports.checkDemo };
//# sourceMappingURL=demo.js.map