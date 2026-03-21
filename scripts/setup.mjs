#!/usr/bin/env node
/**
 * One-time setup: creates the master account in S3.
 * Run ONCE after deploying: node scripts/setup.mjs
 */
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { createHash } from 'crypto'
import { createInterface } from 'readline'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load .env.local
const __dir = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dir, '..', '.env.local')
try {
  const env = readFileSync(envPath, 'utf8')
  for (const line of env.split('\n')) {
    const [k, ...v] = line.split('=')
    if (k && v.length) process.env[k.trim()] = v.join('=').trim()
  }
} catch { /* env vars may already be set */ }

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})
const BUCKET = process.env.S3_BUCKET
const MASTER = process.env.MASTER_USERNAME

// Simple bcrypt-style hash using built-in crypto (good enough for setup script)
// The actual app uses bcryptjs; this script uses a workaround since bcrypt needs node_modules
// We'll dynamically import bcryptjs
async function hashPassword(password) {
  const { default: bcrypt } = await import('bcryptjs')
  return bcrypt.hash(password, 12)
}

async function checkExists() {
  try {
    const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: '_config/users.json' })
    const res = await s3.send(cmd)
    const chunks = []
    for await (const chunk of res.Body) chunks.push(chunk)
    const data = JSON.parse(Buffer.concat(chunks).toString())
    return Object.keys(data).length > 0
  } catch {
    return false
  }
}

async function main() {
  console.log('\n=== Vault App Setup ===\n')
  console.log(`Master username: ${MASTER}`)
  console.log(`S3 Bucket: ${BUCKET}\n`)

  const exists = await checkExists()
  if (exists) {
    console.log('ERROR: Users already exist in S3. Setup already completed.')
    console.log('To reset, manually delete _config/users.json from S3.\n')
    process.exit(1)
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const question = (q) => new Promise(resolve => rl.question(q, resolve))

  const password = await question(`Set password for ${MASTER}: `)
  if (password.length < 6) {
    console.log('ERROR: Password must be at least 6 characters')
    rl.close()
    process.exit(1)
  }

  console.log('\nHashing password...')
  const hash = await hashPassword(password)

  const users = {
    [MASTER]: {
      passwordHash: hash,
      role: 'master',
      createdAt: new Date().toISOString(),
    }
  }

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: '_config/users.json',
    Body: JSON.stringify(users, null, 2),
    ContentType: 'application/json',
  }))

  console.log(`\nMaster account created: ${MASTER}`)
  console.log('Setup complete! You can now sign in at /login using code 062286.\n')
  rl.close()
}

main().catch(e => { console.error(e); process.exit(1) })
