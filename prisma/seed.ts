import { PrismaClient, UserRole } from "@prisma/client"
import { hashPassword } from "../lib/password"

const prisma = new PrismaClient()

async function main() {
  const username = (process.env.SEED_ADMIN_USERNAME ?? "admin").trim().toLowerCase()
  const password = process.env.SEED_ADMIN_PASSWORD ?? "Admin12345!"

  const passwordHash = await hashPassword(password)

  await prisma.user.upsert({
    where: { username },
    update: {
      role: UserRole.ADMIN,
      passwordHash
    },
    create: {
      name: "Admin",
      username,
      passwordHash,
      role: UserRole.ADMIN
    }
  })
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })