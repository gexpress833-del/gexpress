// gen_hashes.js
const bcrypt = require('bcryptjs');

const passwords = [
  { username: 'admin', password: '21121999' },
  // le client est déjà OK, tu peux régénérer si tu veux :
  // { username: 'client', password: 'client123456' }
];

passwords.forEach(p => {
  const hash = bcrypt.hashSync(p.password, 12);
});