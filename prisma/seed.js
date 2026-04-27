const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

// =========================================================
// PRODUCT DATA GENERATORS (Levi's / Amazon / Flipkart style)
// =========================================================

const fits = ['Slim', 'Regular', 'Relaxed', 'Skinny', 'Bootcut', 'Straight', 'Tapered'];
const colors = ['Indigo Blue', 'Dark Wash', 'Light Wash', 'Midnight Black', 'Carbon Grey', 'Stone Wash', 'Raw Denim', 'Vintage Blue', 'Ice Blue', 'Jet Black', 'Charcoal', 'Medium Blue', 'Rinse Wash', 'Faded Blue', 'Ocean Blue'];
const genders = ['Men', 'Women', 'Unisex'];
const sizes = ['26', '28', '30', '32', '34', '36', '38', '40', '42'];
const categories = ['Jeans', 'Jeans', 'Jeans', 'Jeans', 'Shorts', 'Jackets']; // weighted towards Jeans

const lineNames = [
  'Kamikaze 501 Original', 'Kamikaze 511 Slim', 'Kamikaze 505 Regular',
  'Kamikaze 502 Taper', 'Kamikaze 510 Skinny', 'Kamikaze 517 Bootcut',
  'Kamikaze 514 Straight', 'Kamikaze 541 Athletic', 'Kamikaze 527 Slim Boot',
  'Kamikaze 512 Slim Taper', 'Kamikaze Flex Motion', 'Kamikaze Performance',
  'Kamikaze Premium Selvedge', 'Kamikaze Heritage', 'Kamikaze Urban Edge',
  'Kamikaze Street Fighter', 'Kamikaze Tokyo Drift', 'Kamikaze Ronin',
  'Kamikaze Bushido', 'Kamikaze Samurai', 'Kamikaze Shogun',
  'Kamikaze Classic', 'Kamikaze Vintage', 'Kamikaze Modern',
  'Kamikaze Elite', 'Kamikaze Pro', 'Kamikaze Flex',
  'Kamikaze Stretch', 'Kamikaze Comfort', 'Kamikaze Ultra',
  'Kamikaze Raw', 'Kamikaze Washed', 'Kamikaze Distressed',
  'Kamikaze Ripped', 'Kamikaze Patched', 'Kamikaze Acid Wash',
  'Kamikaze Clean Cut', 'Kamikaze Dark Knight', 'Kamikaze Shadow',
  'Kamikaze Storm', 'Kamikaze Thunder', 'Kamikaze Lightning',
  'Kamikaze Rebel', 'Kamikaze Outlaw', 'Kamikaze Maverick',
  'Kamikaze Alpha', 'Kamikaze Omega', 'Kamikaze Delta',
  'Kamikaze Zero', 'Kamikaze Infinity'
];

const descTemplates = [
  "Premium quality %FIT% fit denim in %COLOR%. Crafted from 100% cotton with reinforced stitching for maximum durability. Perfect for everyday wear.",
  "High-performance %FIT% fit jeans featuring advanced stretch technology. The %COLOR% wash gives a modern, refined look suitable for any occasion.",
  "Classic %FIT% fit design in stunning %COLOR%. Made with Japanese selvedge denim for unmatched quality. A timeless addition to your wardrobe.",
  "Engineered for comfort, these %FIT% fit jeans in %COLOR% feature moisture-wicking fabric and 4-way stretch. From office to weekend, they do it all.",
  "Bold and edgy %FIT% fit jeans in %COLOR%. Featuring signature Kamikaze detailing and premium hardware. Stand out from the crowd.",
  "Ultra-comfortable %FIT% fit denim in %COLOR%. Soft-touch fabric with built-in flexibility moves with you all day long.",
  "The ultimate street-style %FIT% fit jeans. %COLOR% colorway with distressed accents and a lived-in feel. Fashion-forward and fearless.",
  "Sustainably crafted %FIT% fit jeans in %COLOR%. Made with organic cotton and eco-friendly dyes. Look good, feel good, do good.",
  "Premium heavyweight %FIT% fit denim in %COLOR%. 14oz fabric that ages beautifully over time. Built for those who appreciate craftsmanship.",
  "Versatile %FIT% fit jeans in %COLOR%. The perfect balance of style and function with hidden comfort features and a flattering silhouette."
];

// Unsplash jeans image URLs (high quality, free to use)
const imageUrls = [
  'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1525049302636-64157dbd7671?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1604176354204-9268737828e4?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1475178626620-a4d074967571?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1602293589930-45aad59ba3ab?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1511105075138-4b5e29f7e4d0?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1555689502-c4b22d76c56f?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1560243563-062bfc001d68?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1551854838-212c50b4c184?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1455026947703-e06111eeaa1b?auto=format&fit=crop&q=80&w=800',
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randPrice(min, max) { return +(min + Math.random() * (max - min)).toFixed(2); }
function randInt(min, max) { return Math.floor(min + Math.random() * (max - min + 1)); }

function generateProducts(count) {
  const products = [];
  for (let i = 0; i < count; i++) {
    const fit = pick(fits);
    const color = pick(colors);
    const gender = pick(genders);
    const size = pick(sizes);
    const category = pick(categories);
    const lineName = pick(lineNames);

    const name = `${lineName} ${fit} ${color} - ${gender}`;
    const desc = pick(descTemplates).replace(/%FIT%/g, fit).replace(/%COLOR%/g, color);
    const basePrice = randPrice(49.99, 199.99);
    const baseWholesalePrice = +(basePrice * (0.4 + Math.random() * 0.2)).toFixed(2);
    const stock = randInt(0, 500);
    const featured = i < 20; // first 20 are featured

    products.push({
      name,
      description: desc,
      category,
      color,
      size,
      fit,
      gender,
      featured,
      basePrice,
      baseWholesalePrice,
      stock,
      imageUrl: imageUrls[i % imageUrls.length],
    });
  }
  return products;
}

// =========
// MAIN SEED
// =========
async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // --- USERS ---
  await prisma.user.upsert({
    where: { email: 'admin@kamikaze.com' },
    update: {},
    create: { email: 'admin@kamikaze.com', name: 'Admin User', password: hashedPassword, role: 'ADMIN' },
  });
  await prisma.user.upsert({
    where: { email: 'retail@kamikaze.com' },
    update: {},
    create: { email: 'retail@kamikaze.com', name: 'Retail Customer', password: hashedPassword, role: 'RETAIL' },
  });
  await prisma.user.upsert({
    where: { email: 'pending@kamikaze.com' },
    update: {},
    create: { email: 'pending@kamikaze.com', name: 'Pending Wholesale', password: hashedPassword, role: 'WHOLESALE_PENDING' },
  });
  await prisma.user.upsert({
    where: { email: 'wholesale@kamikaze.com' },
    update: {},
    create: { email: 'wholesale@kamikaze.com', name: 'Approved Wholesaler', password: hashedPassword, role: 'WHOLESALE_APPROVED' },
  });
  console.log('✓ Users created');

  // --- 400 PRODUCTS ---
  const productsData = generateProducts(400);
  let created = 0;

  // Insert in batches of 50 for efficiency
  for (let i = 0; i < productsData.length; i += 50) {
    const batch = productsData.slice(i, i + 50);
    for (const p of batch) {
      await prisma.product.create({
        data: {
          ...p,
          tierDiscounts: {
            create: [
              { minQuantity: 50, discountPct: 5 },
              { minQuantity: 100, discountPct: 10 },
              { minQuantity: 200, discountPct: 15 },
            ]
          }
        }
      });
      created++;
    }
    console.log(`  ✓ Created ${created} / ${productsData.length} products`);
  }

  console.log(`\n✅ Seeding complete! ${created} products created.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
