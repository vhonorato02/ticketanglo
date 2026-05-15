import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const port = Number.parseInt(process.env.SMOKE_PORT ?? '3100', 10);
const baseUrl = `http://localhost:${port}`;
const timeoutMs = 45_000;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForServer(processRef) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (processRef.exitCode !== null) {
      throw new Error(`next dev exited early with code ${processRef.exitCode}`);
    }

    try {
      const response = await fetch(`${baseUrl}/login`, { redirect: 'manual' });
      if (response.status === 200) return;
    } catch {
      await sleep(500);
    }
  }

  throw new Error(`server did not become ready at ${baseUrl}`);
}

async function postInvalidCredentials() {
  const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
  assert(csrfResponse.status === 200, 'csrf endpoint should respond 200');

  const cookie = csrfResponse.headers.get('set-cookie')?.split(';')[0] ?? '';
  const { csrfToken } = await csrfResponse.json();
  const body = new URLSearchParams({
    csrfToken,
    username: 'admin',
    password: 'senha-errada',
    redirect: 'false',
    json: 'true',
  });

  const startedAt = Date.now();
  const response = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', cookie },
    body,
    redirect: 'manual',
  });

  assert(response.status === 302, 'invalid credentials should redirect');
  assert(
    response.headers.get('location')?.includes('CredentialsSignin'),
    'invalid credentials should land on the credentials error URL',
  );
  assert(Date.now() - startedAt < 5_000, 'invalid credentials should fail quickly');
}

async function runChecks() {
  const loginResponse = await fetch(`${baseUrl}/login`);
  const loginHtml = await loginResponse.text();
  assert(loginResponse.status === 200, 'login should render');
  assert(loginHtml.includes('TicketAnglo'), 'login should include product name');
  assert(loginHtml.includes('Usuário'), 'login should include username label');
  assert(loginHtml.includes('Senha'), 'login should include password label');

  const protectedResponse = await fetch(`${baseUrl}/tickets?page=abc&status=bad`, {
    redirect: 'manual',
  });
  const protectedLocation = protectedResponse.headers.get('location') ?? '';
  assert([302, 307].includes(protectedResponse.status), 'protected page should redirect');
  assert(protectedLocation.startsWith('/login?callbackUrl='), 'redirect should use clean login URL');
  assert(!protectedLocation.startsWith('/login?page='), 'redirect should not leak page filters');

  const providersResponse = await fetch(`${baseUrl}/api/auth/providers`);
  const providersBody = await providersResponse.text();
  assert(providersResponse.status === 200, 'providers endpoint should respond');
  assert(providersBody.includes('credentials'), 'credentials provider should be registered');

  const bootstrapResponse = await fetch(`${baseUrl}/api/admin/bootstrap`, { method: 'POST' });
  assert(bootstrapResponse.status === 401, 'bootstrap should reject missing bearer token');

  await postInvalidCredentials();
}

const child = spawn(
  process.execPath,
  ['node_modules/next/dist/bin/next', 'dev', '-p', String(port)],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DATABASE_URL:
        process.env.DATABASE_URL ??
        'postgresql://user:password@example.neon.tech/dbname?sslmode=require',
      DATABASE_TIMEOUT_MS: process.env.DATABASE_TIMEOUT_MS ?? '1000',
      AUTH_SECRET: process.env.AUTH_SECRET ?? 'smoke-test-secret',
      NEXTAUTH_URL: baseUrl,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);

let output = '';
child.stdout.on('data', (chunk) => {
  output += chunk.toString();
});
child.stderr.on('data', (chunk) => {
  output += chunk.toString();
});

try {
  await waitForServer(child);
  await runChecks();
  console.log('Smoke tests passed.');
} catch (error) {
  console.error(output.slice(-4000));
  console.error(error);
  process.exitCode = 1;
} finally {
  child.kill();
}
