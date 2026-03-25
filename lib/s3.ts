import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command, CopyObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export const BUCKET = process.env.S3_BUCKET!

export async function getUploadUrl(key: string, contentType: string): Promise<string> {
  const cmd = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType })
  return getSignedUrl(s3, cmd, { expiresIn: 3600 })
}

export async function getViewUrl(key: string, expiresIn = 3600): Promise<string> {
  const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key })
  return getSignedUrl(s3, cmd, { expiresIn })
}

export async function deleteObject(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}

export async function listObjects(prefix: string): Promise<{ key: string; size: number; lastModified: Date }[]> {
  const results: { key: string; size: number; lastModified: Date }[] = []
  let continuationToken: string | undefined

  do {
    const cmd = new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    })
    const res = await s3.send(cmd)
    for (const obj of res.Contents ?? []) {
      if (obj.Key && obj.Key !== prefix) {
        results.push({ key: obj.Key, size: obj.Size ?? 0, lastModified: obj.LastModified ?? new Date() })
      }
    }
    continuationToken = res.NextContinuationToken
  } while (continuationToken)

  return results
}

export async function getObject(key: string): Promise<string> {
  const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key })
  const res = await s3.send(cmd)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (res.Body as any).transformToString()
}

export async function moveObject(oldKey: string, newKey: string): Promise<void> {
  await s3.send(new CopyObjectCommand({ Bucket: BUCKET, CopySource: `${BUCKET}/${oldKey}`, Key: newKey }))
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: oldKey }))
}

export async function putObject(key: string, body: string): Promise<void> {
  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: 'application/json' }))
}
