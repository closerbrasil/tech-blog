export const config = {
  database: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_liUMtvdsZK35@ep-patient-violet-acbxc0k4-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require',
  storage: {
    projectId: 'cedar-bot-263413',
    bucketName: 'closer-brasil',
    keyFilePath: './key/closer-storage.json'
  }
}; 