import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/db';
import { users } from '@/db/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Sincroniza o usuário master `anglo` com a senha padrão.
 * Protegido pelo header `Authorization: Bearer <AUTH_SECRET>`.
 *
 * Uso:
 *   curl -X POST https://<seu-dominio>/api/admin/bootstrap \
 *     -H "Authorization: Bearer $AUTH_SECRET"
 */
export async function POST(req: Request) {
  const auth = req.headers.get('authorization');
  const expected = `Bearer ${process.env.AUTH_SECRET ?? ''}`;

  if (!process.env.AUTH_SECRET || auth !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const passwordHash = await bcrypt.hash('tianglo26##', 12);

  await db
    .insert(users)
    .values({
      username: 'anglo',
      displayName: 'Anglo Pindamonhangaba',
      passwordHash,
      isAdmin: true,
    })
    .onConflictDoUpdate({
      target: users.username,
      set: {
        passwordHash,
        displayName: 'Anglo Pindamonhangaba',
        isAdmin: true,
        isActive: true,
      },
    });

  return NextResponse.json({
    ok: true,
    message: 'Usuário anglo sincronizado com a senha padrão.',
  });
}
