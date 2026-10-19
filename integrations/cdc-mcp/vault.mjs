import { mkdir, readFile, writeFile, rename, rm, open } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { PRIVATE } from './config.mjs';

// Tokens never enter MCP responses, command arguments, logs or version control.
function protect(input, decrypt = false) {
  if (process.platform !== 'win32') throw new Error('Ce coffre utilise la protection du compte Windows (DPAPI).');
  const script = `Add-Type -AssemblyName System.Security; $data=[Console]::In.ReadToEnd(); $bytes=[Convert]::FromBase64String($data); $result=[Security.Cryptography.ProtectedData]::${decrypt ? 'Unprotect' : 'Protect'}($bytes,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser); [Console]::Out.Write([Convert]::ToBase64String($result))`;
  return new Promise((resolve, reject) => {
    const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', part => { output += part; });
    child.stderr.resume();
    child.on('error', () => reject(new Error('Coffre Windows indisponible.')));
    child.on('close', code => code === 0 ? resolve(Buffer.from(output.trim(), 'base64')) : reject(new Error('Impossible de lire ou protéger la session Windows.')));
    child.stdin.end(Buffer.from(input).toString('base64'));
  });
}
export class Vault {
  constructor(directory = PRIVATE) { this.directory = directory; this.file = path.join(directory, 'session.dpapi'); }
  async read() {
    try { return JSON.parse((await protect(await readFile(this.file), true)).toString('utf8')); }
    catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  }
  async write(session) {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    const temporary = `${this.file}.${process.pid}.tmp`;
    await writeFile(temporary, await protect(Buffer.from(JSON.stringify(session))), { mode: 0o600 });
    await rename(temporary, this.file);
  }
  async clear() { await rm(this.file, { force: true }); }
  async locked(callback) {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    const lockPath = path.join(this.directory, 'session.lock');
    let lock;
    for (let attempt = 0; attempt < 100; attempt++) {
      try {
        lock = await open(lockPath, 'wx');
        await lock.writeFile(JSON.stringify({ pid: process.pid }));
        break;
      } catch (error) {
        if (error.code !== 'EEXIST') throw error;
        // Recover a lock left by a crashed MCP process, without removing a live owner's lock.
        try {
          const owner = JSON.parse(await readFile(lockPath, 'utf8'));
          if (Number.isInteger(owner.pid) && owner.pid > 0) {
            try { process.kill(owner.pid, 0); }
            catch (probe) { if (probe.code === 'ESRCH') await rm(lockPath, { force: true }); }
          }
        } catch { /* Another process may still be writing its lock. */ }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    if (!lock) throw new Error('Session occupée. Réessayez, ou reconnectez le connecteur si un ancien processus a été arrêté.');
    try { return await callback(); } finally { await lock.close(); await rm(lockPath, { force: true }); }
  }
}
