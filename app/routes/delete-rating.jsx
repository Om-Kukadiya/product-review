import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function loader({ request }) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (request.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: corsHeaders
      });
    }

    const url = new URL(request.url);
    const ratingId = url.searchParams.get('id');

    if (!ratingId) {
      return new Response(JSON.stringify({ error: 'Missing rating ID' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const deleted_MI = await prisma.rating.delete({
      where: { id: Number(ratingId) },
    });

    return new Response(JSON.stringify({
      message: 'Rating deleted successfully',
      deletedId: deleted_MI.id
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: corsHeaders
    });
  }
}