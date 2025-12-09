import { PrismaClient } from '../../../generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '$env/dynamic/private';

const dataBaseURL = env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString: dataBaseURL });
export const prisma = new PrismaClient({ adapter });
