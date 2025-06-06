import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function validateRatingInput_MI(data) {
  const errors = [];
  if (!data.shop || typeof data.shop !== 'string') {
    errors.push('Invalid or missing shop');
  }
  if (!data.productId || isNaN(parseInt(data.productId))) {
    errors.push('Invalid or missing productId');
  }
  if (!data.customerName || typeof data.customerName !== 'string') {
    errors.push('Invalid or missing customerName');
  }
  if (!data.star || isNaN(parseInt(data.star)) || data.star < 1 || data.star > 5) {
    errors.push('Invalid star rating (must be 1-5)');
  }
  // Optional: Validate email format if it exists
  if (data.customerEmail && typeof data.customerEmail !== 'string') {
    errors.push('Invalid customerEmail');
  }
  return errors;
}

function serializeRating_MI(rating) {
  return {
    id: rating.id.toString(),
    shop: rating.shop,
    productId: rating.productId.toString(),
    star: rating.star,
    customerName: rating.customerName,
    customerEmail: rating.customerEmail || '', // Add this line
    reviewTitle: rating.reviewTitle || '',
    review: rating.review || '',
    status: rating.status || 'pending',
    author: rating.author || 'customer',
    createdAt: rating.createdAt.toISOString(),
    media: rating.media,
  };
}

export async function loader({ request }) {
  try {
    const url = new URL(request.url);
    const shop = url.searchParams.get('shop');
    const productId = url.searchParams.get('product_id');

    if (!shop) {
      return new Response(JSON.stringify({ error: 'Missing shop parameter' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const account_MI = await prisma.account.findUnique({
      where: { shop },
      select: { serialkey: true },
    });

    if (!account_MI?.serialkey) {
      return new Response(JSON.stringify({ error: 'Invalid shop' }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    const serialkey_MI = account_MI.serialkey;

    const statusSetting_MI = await prisma.settings.findUnique({
      where: { key: serialkey_MI },
    });

    if (!statusSetting_MI || statusSetting_MI.value?.toLowerCase() !== 'enabled') {
      return new Response(JSON.stringify({ reviews: [] }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const whereClause_MI = {
      shop,
      ...(productId && !isNaN(parseInt(productId)) ? { productId: BigInt(productId) } : {}),
    };

    const ratings_MI = await prisma.rating.findMany({
      where: whereClause_MI,
      orderBy: { createdAt: 'desc' },
    });

    const serialized_MI = ratings_MI.map(serializeRating_MI);

    return new Response(JSON.stringify({ reviews: serialized_MI }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

export async function action({ request }) {
  const method = request.method;

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const data = await request.json();

    if (method === 'POST') {
      const validationErrors = validateRatingInput_MI(data);
      if (validationErrors.length > 0) {
        return new Response(JSON.stringify({ error: validationErrors.join(', ') }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      const { shop, productId, customerName, customerEmail, star, review, status } = data;

      const newRating_MI = await prisma.rating.create({
        data: {
          shop,
          productId: BigInt(productId),
          customerName,
          customerEmail: customerEmail || null, // Add this line
          star: parseInt(star),
          review: review || '',
          status: status || 'pending',
        },
      });

      return new Response(JSON.stringify({ success: true, rating: serializeRating_MI(newRating_MI) }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'PUT') {
      const { id } = data;
      
      if (!id || isNaN(parseInt(id))) {
        return new Response(JSON.stringify({ error: 'Invalid or missing ID' }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      const validationErrors = validateRatingInput_MI(data);
      if (validationErrors.length > 0) {
        return new Response(JSON.stringify({ error: validationErrors.join(', ') }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      const { shop, productId, customerName, customerEmail, star, review, status } = data;

      const updated_MI = await prisma.rating.update({
        where: { id: BigInt(id) },
        data: {
          shop,
          productId: BigInt(productId),
          customerName,
          customerEmail: customerEmail || null, // Add this line
          star: parseInt(star),
          review: review || '',
          status: status || 'pending',
        },
      });

      return new Response(JSON.stringify({ success: true, rating: serializeRating_MI(updated_MI) }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (method === 'DELETE') {
      const { id } = data;

      if (!id || isNaN(parseInt(id))) {
        return new Response(JSON.stringify({ error: 'Invalid or missing ID' }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      await prisma.rating.delete({
        where: { id: BigInt(id) },
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: corsHeaders,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `${method} failed`, details: error.message }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  } finally {
    if (process.env.NODE_ENV === 'production') {
      await prisma.$disconnect();
    }
  }
}