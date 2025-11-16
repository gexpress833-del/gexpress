const bcrypt = require('bcryptjs');

// remplace par le hash de la DB que tu as copié
const adminHash = '$2a$12$EOpCybRTGKFf2kUZ8GnSUuGJhAk.87US5xj/ahycJSmLro.ovT9p.';
const password = '21121999';

const match = bcrypt.compareSync(password, adminHash);