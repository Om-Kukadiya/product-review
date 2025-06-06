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
    const productIdsParam = url.searchParams.get('product_ids');

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

    const settingsResult = await prisma.settings.findMany({
      where: { key: { in: [serialkey_MI, `${serialkey_MI}_displayStyle`, `${serialkey_MI}_reviewLimit`, `${serialkey_MI}_reviewDisplayHeading`] } }
    });

    const settingsMap = settingsResult.reduce((acc, setting) => {
      acc[setting.key] = setting;
      return acc;
    }, {});

    const statusSetting_MI = settingsMap[serialkey_MI];
    if (!statusSetting_MI || statusSetting_MI.value.toLowerCase() !== 'enabled') {
      return new Response(JSON.stringify({ reviews: [], settings: { status: { value: 'disabled' } } }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const displayType_MI = settingsMap[`${serialkey_MI}_displayStyle`]?.value?.toLowerCase() || 'carousel';
    const displayLimit_MI = parseInt(settingsMap[`${serialkey_MI}_reviewLimit`]?.value || "5");
    const reviewDisplayHeading_MI = settingsMap[`${serialkey_MI}_reviewDisplayHeading`]?.value || "Customer Reviews";

    const whereClause_MI = { shop, status: 'approved' };
    if (productId) {
      whereClause_MI.productId = BigInt(productId);
    } else if (productIdsParam) {
      const productIds = productIdsParam.split(',').map(id => BigInt(id));
      if (productIds.length > 0) {
        whereClause_MI.productId = { in: productIds };
      }
    }

    const ratings_MI = await prisma.rating.findMany({
      where: whereClause_MI,
      orderBy: { createdAt: 'desc' },
      take: productId ? displayLimit_MI : undefined, // Only limit if fetching for a single product
    });

    const appUrl = process.env.SHOPIFY_APP_URL || '';
    const serialized_MI = ratings_MI.map((r) => {
      let processedMedia = null;
      if (r.media) {
        try {
          const mediaPaths = JSON.parse(r.media);
          if (Array.isArray(mediaPaths)) {
            processedMedia = JSON.stringify(mediaPaths.map(path => path.startsWith('http') ? path : `${appUrl}${path}`));
          }
        } catch (e) {
          if (typeof r.media === 'string' && r.media.startsWith('http')) {
            processedMedia = JSON.stringify([r.media]);
          } else if (typeof r.media === 'string') {
            processedMedia = JSON.stringify([`${appUrl}${r.media}`]);
          }
        }
      }
      return {
        id: r.id.toString(),
        shop: r.shop,
        productId: r.productId.toString(),
        star: r.star,
        customerName: r.customerName,
        reviewTitle: r.reviewTitle,
        review: r.review,
        createdAt: r.createdAt,
        media: processedMedia,
      };
    });
    
    // If fetching for multiple products, group them
    if (productIdsParam) {
        const reviewsByProduct = serialized_MI.reduce((acc, review) => {
            (acc[review.productId] = acc[review.productId] || []).push(review);
            return acc;
        }, {});
        // Apply limit per product
        for (const pid in reviewsByProduct) {
            reviewsByProduct[pid] = reviewsByProduct[pid].slice(0, displayLimit_MI);
        }
        return new Response(JSON.stringify({ 
            reviewsByProduct, 
            displayType: displayType_MI,
            settings: { status: { value: 'enabled' } }, 
            reviewDisplayHeading: reviewDisplayHeading_MI 
        }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }


    return new Response(JSON.stringify({ 
      reviews: serialized_MI, 
      displayType: displayType_MI,
      settings: { status: { value: 'enabled' } }, 
      reviewDisplayHeading: reviewDisplayHeading_MI 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: `Internal Server Error: ${error.message}` }), { 
      status: 500,
      headers: corsHeaders
    });
  } finally {
    await prisma.$disconnect();
  }
}