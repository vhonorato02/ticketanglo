import 'dotenv/config';
import { db } from './index';
import { users } from './schema';
import bcrypt from 'bcryptjs';

const SEED_USERS = [
  { username: 'natalia', displayName: 'Natália', password: 'anglo2025', isAdmin: true },
  { username: 'ti', displayName: 'Equipe TI', password: 'anglo2025', isAdmin: false },
  { username: 'marketing', displayName: 'Equipe Marketing', password: 'anglo2025', isAdmin: false },
];

async function seed() {
  console.log('🌱 Iniciando seed...');

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
      .onConflictDoNothing();
    console.log(`✓ Usuário criado: ${u.username}`);
  }

  console.log('✅ Seed concluído!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Erro no seed:', err);
  process.exit(1);
});
