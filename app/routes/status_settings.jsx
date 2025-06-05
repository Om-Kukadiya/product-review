import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function loader({ request }) {
  try {
    const url = new URL(request.url);
    const shop = url.searchParams.get('shop');
    const productId = url.searchParams.get('product_id');

    if (!shop) {
      return new Response(JSON.stringify({ error: 'Missing shop parameter' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const account_MI = await prisma.account.findUnique({
      where: { shop },
      select: { serialkey: true }
    });

    if (!account_MI?.serialkey) {
      return new Response(JSON.stringify({ error: 'No serial key found for shop' }), {
        status: 404,
        headers: corsHeaders
      });
    }

    const serialkey_MI = account_MI.serialkey;

    const setting_MI = await prisma.settings.findUnique({
      where: { key: serialkey_MI }
    });
    const reviewFormHeadingSetting_MI = await prisma.settings.findUnique({
      where: { key: `${serialkey_MI}_reviewFormHeading` }
    });

    const ratingStatus_MI = setting_MI.value.toLowerCase() === 'enabled';
    const reviewFormHeading_MI = reviewFormHeadingSetting_MI?.value || "Rate This Product";

    return new Response(JSON.stringify({ 
      rating_status: ratingStatus_MI,
      reviewFormHeading: reviewFormHeading_MI
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: corsHeaders,
    });
  } finally {
    await prisma.$disconnect();
  }
}