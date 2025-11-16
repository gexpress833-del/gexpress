// check_hashes.js
const bcrypt = require('bcryptjs');

// Remplace ces valeurs par les password et les hashes exacts depuis Supabase
const tests = [
  { username: 'admin', password: '21121999', hash: '$2b$12$t6q4oktFScKTeJelsDjrZOeSxUZiWk43isjWqCkvbbUyQzYX0FH5a' },
  { username: 'client', password: 'client123456', hash: '$2a$12$EOpCybRTGKFf2kUZ8GnSUuGJhAk.87US5xj/ahycJSmLro.ovT9p.' }
];

tests.forEach(t => {
  try {
    const ok = bcrypt.compareSync(t.password, t.hash);
  } catch (e) {
  }
});