import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// GET /api/admin/products — list all products (paginated)
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    const where = search
      ? { name: { contains: search } }
      : {};

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({ products, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

// POST /api/admin/products — create new product (supports FormData with image upload)
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const { writeFile, mkdir } = await import("fs/promises");
    const path = await import("path");

    const name = formData.get('name');
    const description = formData.get('description') || '';
    const category = formData.get('category') || 'Jeans';
    const color = formData.get('color') || 'Blue';
    const size = formData.get('size') || '32';
    const fit = formData.get('fit') || 'Regular';
    const gender = formData.get('gender') || 'Unisex';
    const displayStatus = formData.get('displayStatus') || 'NORMAL';
    const featured = displayStatus === 'FEATURED';
    const basePrice = parseFloat(formData.get('basePrice') || '0');
    const baseWholesalePrice = parseFloat(formData.get('baseWholesalePrice') || '0');
    const stock = parseInt(formData.get('stock') || '0');
    const salePriceRaw = formData.get('salePrice');
    const salePrice = salePriceRaw && parseFloat(salePriceRaw) > 0 ? parseFloat(salePriceRaw) : null;
    const imageFile = formData.get('image');

    if (!name || !basePrice) {
      return NextResponse.json({ error: "Name and price are required" }, { status: 400 });
    }

    if (salePrice !== null && salePrice >= basePrice) {
      return NextResponse.json({ error: "Sale price must be less than original price" }, { status: 400 });
    }

    let imageUrl = formData.get('imageUrl') || null;

    // If an image file was uploaded, save it to /public/uploads/
    if (imageFile && imageFile.size > 0) {
      const uploadsDir = path.default.join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadsDir, { recursive: true });

      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const ext = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const filePath = path.default.join(uploadsDir, fileName);

      await writeFile(filePath, buffer);
      imageUrl = `/uploads/${fileName}`;
    }

    const product = await prisma.product.create({
      data: {
        name, description, category, color, size, fit, gender,
        featured, displayStatus, salePrice,
        basePrice, baseWholesalePrice, stock, imageUrl,
        tierDiscounts: {
          create: [
            { minQuantity: 50, discountPct: 5 },
            { minQuantity: 100, discountPct: 10 },
          ]
        }
      }
    });

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

// PATCH /api/admin/products — update product fields (displayStatus, salePrice, stock, featured)
export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, displayStatus, salePrice, stockAdjust } = body;

    if (!id) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    const updateData = {};

    if (displayStatus !== undefined) {
      updateData.displayStatus = displayStatus;
      updateData.featured = displayStatus === 'FEATURED';
    }

    if (salePrice !== undefined) {
      updateData.salePrice = salePrice === null || salePrice === '' ? null : parseFloat(salePrice);
    }

    if (stockAdjust !== undefined) {
      // Get current stock to ensure it doesn't go below 0
      const current = await prisma.product.findUnique({ where: { id }, select: { stock: true } });
      const newStock = Math.max(0, (current?.stock || 0) + parseInt(stockAdjust));
      updateData.stock = newStock;
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

// DELETE /api/admin/products?id=xxx — delete product
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
