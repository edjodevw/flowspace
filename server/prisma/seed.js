const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Ensuring default accounts exist...')
  
  const adminPassword = await bcrypt.hash('flowspaceadmin012704', 10)
  const userPassword = await bcrypt.hash('password123', 10)

  // Upsert Super Admin account
  await prisma.user.upsert({
    where: { email: 'superadmin@flowspace.com' },
    update: {
      isAdmin: true
    },
    create: {
      name: 'Super Admin',
      email: 'superadmin@flowspace.com',
      password: adminPassword,
      isAdmin: true,
      createdAt: new Date()
    }
  })

  // Upsert Edududud user account
  await prisma.user.upsert({
    where: { email: 'eh@gmail.com' },
    update: {},
    create: {
      name: 'Edududud',
      email: 'eh@gmail.com',
      password: userPassword,
      isAdmin: false,
      createdAt: new Date()
    }
  })

  console.log('Accounts verified!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
