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

    const statusSetting_MI = await prisma.settings.findUnique({
      where: { key: serialkey_MI }
    });
    const displayTypeSetting_MI = await prisma.settings.findUnique({
      where: { key: `${serialkey_MI}_displayStyle` }
    });
    const displayLimitSetting_MI = await prisma.settings.findUnique({
      where: { key: `${serialkey_MI}_reviewLimit` }
    });
    const reviewDisplayHeadingSetting_MI = await prisma.settings.findUnique({
      where: { key: `${serialkey_MI}_reviewDisplayHeading` }
    });

    if (!statusSetting_MI || statusSetting_MI.value.toLowerCase() !== 'enabled') {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const displayType_MI = displayTypeSetting_MI?.value?.toLowerCase() || 'carousel';
    const displayLimit_MI = parseInt(displayLimitSetting_MI?.value || "5");
    const reviewDisplayHeading_MI = reviewDisplayHeadingSetting_MI?.value || "Customer Reviews";

    const whereClause_MI = {
      shop,
      status: 'approved',
      ...(productId ? { productId: BigInt(productId) } : {}),
    };

    const ratings_MI = await prisma.rating.findMany({
      where: whereClause_MI,
      orderBy: {
        createdAt: 'desc',
      },
      take: displayLimit_MI,
    });

    const appUrl = process.env.SHOPIFY_APP_URL || ''; // Get app URL, default to empty string if not set

    const serialized_MI = ratings_MI.map((r) => {
      let processedMedia = null;
      if (r.media) {
        try {
          const mediaPaths = JSON.parse(r.media); // Expecting an array of paths
          if (Array.isArray(mediaPaths)) {
            processedMedia = JSON.stringify(mediaPaths.map(path => path.startsWith('http') ? path : `${appUrl}${path}`));
          } else if (typeof mediaPaths === 'string') {
            // Handle case where r.media is a single path string but JSON.parse made it a string
             processedMedia = JSON.stringify([mediaPaths.startsWith('http') ? mediaPaths : `${appUrl}${mediaPaths}`]);
          }
        } catch (e) {
          // If r.media is not a JSON string (e.g., a single URL string for older data)
          if (typeof r.media === 'string') {
             // Check if it's already an absolute URL
            if (r.media.startsWith('http')) {
              processedMedia = r.media; // Keep it as is
            } else {
              // It's a single relative path, prepend appUrl and keep as a string
              // The rating_status.liquid will handle parsing this if it's not an array
              processedMedia = `${appUrl}${r.media}`;
            }
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

    const settingsData_MI = {
      status: statusSetting_MI ? { key: serialkey_MI, value: statusSetting_MI.value } : null,
      displayStyle: displayTypeSetting_MI ? { key: `${serialkey_MI}_displayStyle`, value: displayTypeSetting_MI.value } : null, 
      reviewLimit: displayLimitSetting_MI ? { key: `${serialkey_MI}_reviewLimit`, value: displayLimitSetting_MI.value } : null, 
      reviewDisplayHeading: reviewDisplayHeadingSetting_MI ? { key: `${serialkey_MI}_reviewDisplayHeading`, value: reviewDisplayHeadingSetting_MI.value } : null
    };

    return new Response(JSON.stringify({ 
      reviews: serialized_MI, 
      displayType: displayType_MI,
      settings: settingsData_MI, 
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