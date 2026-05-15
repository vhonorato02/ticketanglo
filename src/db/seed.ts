import { db } from './index';
import { users } from './schema';
import bcrypt from 'bcryptjs';

const SEED_USERS = [
  { username: 'anglo', displayName: 'Anglo Pindamonhangaba', password: 'tianglo26##', isAdmin: true },
];

async function seed() {
  console.log('Iniciando seed...');

  for (const u of SEED_USERS) {
    const passwordHash = await bcrypt.hash(u.password, 12);
    await db
      .insert(users)
      .values({
        username: u.username,
        displayName: u.displayName,
        passwordHash,
        isAdmin: u.isAdmin,
      })
      .onConflictDoUpdate({
        target: users.username,
        set: { passwordHash, displayName: u.displayName, isAdmin: u.isAdmin, isActive: true },
      });
    console.log(`Usuário sincronizado: ${u.username}`);
  }

  console.log('Seed concluído.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Erro no seed:', err);
  process.exit(1);
});
