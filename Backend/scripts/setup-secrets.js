#!/usr/bin/env node
/**
 * Script de setup inicial - gera segredos seguros para desenvolvimento local
 * Executado automaticamente no primeiro `npm run dev` ou `bun dev`
 */

const { writeFileSync, existsSync, readFileSync } = require('fs');
const { join, dirname } = require('path');
const { randomBytes } = require('crypto');

// Backend é o diretório pai de scripts/
const BACKEND_ROOT = dirname(__dirname);
const ENV_LOCAL_PATH = join(BACKEND_ROOT, '.env.local');

// Se .env.local já existe, não sobrescrever
if (existsSync(ENV_LOCAL_PATH)) {
  const content = readFileSync(ENV_LOCAL_PATH, 'utf-8');
  const hasJwtSecret = content.includes('JWT_SECRET=');
  const hasJwtRefreshSecret = content.includes('JWT_REFRESH_SECRET=');

  if (hasJwtSecret && hasJwtRefreshSecret) {
    console.log('✅ .env.local já configurado com JWT_SECRET e JWT_REFRESH_SECRET');
    process.exit(0);
  }
}

function generateSecureSecret(length = 64) {
  return randomBytes(length).toString('hex');
}

const newEnvContent = `# Segredos gerados automaticemente - NÃO commitar este arquivo
JWT_SECRET="${generateSecureSecret()}"
JWT_REFRESH_SECRET="${generateSecureSecret()}"
`;

try {
  writeFileSync(ENV_LOCAL_PATH, newEnvContent, { encoding: 'utf-8' });
  console.log('🔐 Segredos JWT gerados com sucesso em Backend/.env.local');
  console.log('⚠️  NÃO commitar este arquivo no git!');
} catch (error) {
  console.error('❌ Erro ao criar .env.local:', error.message);
  process.exit(1);
}
