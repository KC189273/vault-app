import { getObject, putObject } from './s3'
import bcrypt from 'bcryptjs'

const USERS_KEY = '_config/users.json'

export interface UserRecord {
  passwordHash: string
  role: 'master' | 'user'
  createdAt: string
}

export type UsersDB = Record<string, UserRecord>

export async function loadUsers(): Promise<UsersDB> {
  try {
    const raw = await getObject(USERS_KEY)
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export async function saveUsers(db: UsersDB): Promise<void> {
  await putObject(USERS_KEY, JSON.stringify(db, null, 2))
}

export async function getUser(username: string): Promise<UserRecord | null> {
  const db = await loadUsers()
  return db[username] ?? null
}

export async function validatePassword(username: string, password: string): Promise<UserRecord | null> {
  const user = await getUser(username)
  if (!user) return null
  const ok = await bcrypt.compare(password, user.passwordHash)
  return ok ? user : null
}

export async function createUser(username: string, password: string, role: 'master' | 'user'): Promise<void> {
  const db = await loadUsers()
  if (db[username]) throw new Error('User already exists')
  const hash = await bcrypt.hash(password, 12)
  db[username] = { passwordHash: hash, role, createdAt: new Date().toISOString() }
  await saveUsers(db)
}

export async function changePassword(username: string, newPassword: string): Promise<void> {
  const db = await loadUsers()
  if (!db[username]) throw new Error('User not found')
  db[username].passwordHash = await bcrypt.hash(newPassword, 12)
  await saveUsers(db)
}

export async function deleteUser(username: string): Promise<void> {
  const db = await loadUsers()
  delete db[username]
  await saveUsers(db)
}

export async function listUsers(): Promise<{ username: string; role: 'master' | 'user'; createdAt: string }[]> {
  const db = await loadUsers()
  return Object.entries(db).map(([username, rec]) => ({ username, role: rec.role, createdAt: rec.createdAt }))
}
