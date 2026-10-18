import { randomBytes, pbkdf2Sync } from 'node:crypto';
import { stdin, stdout } from 'node:process';

// Run privately in a terminal. Password input is hidden and is never written to disk.
if (!stdin.isTTY) throw new Error('Run in an interactive terminal. Do not put the password in command arguments.');
stdout.write('Admin password (hidden): ');
stdin.setRawMode(true);
stdin.resume();
let password = '';
stdin.on('data', (chunk) => {
  for (const char of chunk.toString('utf8')) {
    if (char === '\u0003') process.exit(1);
    if (char === '\r' || char === '\n') {
      stdin.setRawMode(false);
      stdin.pause();
      if (password.length < 10) throw new Error('Use at least 10 characters.');
      const salt = randomBytes(16);
      const hash = pbkdf2Sync(password, salt, 100000, 32, 'sha256');
      password = '';
      stdout.write(`\nSet these as encrypted Cloudflare secrets, never as public build variables:\nADMIN_PASSWORD_HASH=pbkdf2-sha256$100000$${salt.toString('base64')}$${hash.toString('base64')}\nSESSION_SECRET=${randomBytes(32).toString('base64url')}\n`);
      process.exit(0);
    }
    if (char === '\u007f' || char === '\b') password = password.slice(0, -1);
    else if (char >= ' ') password += char;
  }
});
