/**
 * Script to create/update the production admin user.
 * Run: node prisma/setup-admin.js
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'mp187364@gmail.com';
  const adminPassword = '#Mohitpandey@4242#';
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  // Create/update admin user
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
      name: 'Admin',
    },
    create: {
      email: adminEmail,
      name: 'Admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin user created/updated:', admin.email, '→', admin.role);

  // Remove demo accounts for security
  const demoEmails = [
    'admin@kamikaze.com',
    'retail@kamikaze.com',
    'wholesale@kamikaze.com',
    'pending@kamikaze.com',
  ];

  for (const email of demoEmails) {
    try {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        // Delete related records first
        await prisma.cartItem.deleteMany({ where: { userId: existing.id } });
        await prisma.wishlistItem.deleteMany({ where: { userId: existing.id } });
        await prisma.review.deleteMany({ where: { userId: existing.id } });
        await prisma.session.deleteMany({ where: { userId: existing.id } });
        await prisma.account.deleteMany({ where: { userId: existing.id } });
        // Check if there are orders — don't delete those for audit trail
        const orderCount = await prisma.order.count({ where: { userId: existing.id } });
        if (orderCount === 0) {
          await prisma.user.delete({ where: { email } });
          console.log('🗑️  Removed demo account:', email);
        } else {
          // Deactivate instead of delete to preserve order history
          await prisma.user.update({
            where: { email },
            data: { role: 'RETAIL', password: await bcrypt.hash(crypto.randomUUID(), 12) },
          });
          console.log('🔒 Deactivated demo account (has orders):', email);
        }
      }
    } catch (e) {
      console.log('⚠️  Could not remove', email, ':', e.message);
    }
  }

  console.log('\n✅ Admin setup complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
