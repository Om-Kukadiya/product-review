// function convertBigInt_MI(obj) {
//   if (obj === null || obj === undefined) return obj;
//   if (typeof obj === 'bigint') return obj.toString();
  
//   if (Array.isArray(obj)) {
//     return obj.map(convertBigInt_MI);
//   }

//   if (typeof obj === 'object') {
//     const newObj = {};
//     for (const key in obj) {
//       if (obj.hasOwnProperty(key)) {
//         newObj[key] = convertBigInt_MI(obj[key]);
//       }
//     }
//     return newObj;
//   }

//   return obj;
// }

// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// const corsHeaders = {
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
//   "Access-Control-Allow-Headers": "Content-Type, Authorization",
// };

// export async function action({ request }) {
//   if (request.method === 'OPTIONS') {
//     return new Response(null, {
//       status: 200,
//       headers: corsHeaders,
//     });
//   }

//   if (request.method !== 'POST') {
//     return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
//       status: 405,
//       headers: corsHeaders,
//     });
//   }

//   try {
//     const data = await request.json();
//     const { shop, productId, customerName, review, star, status, reviewTitle, author } = data;

    
//     if (!shop || !productId || !customerName || !review) {
//       return new Response(JSON.stringify({ error: 'Missing required fields' }), {
//         status: 400,
//         headers: corsHeaders,
//       });
//     }

//     const newRating_MI = await prisma.rating.create({
//       data: {
//         shop,
//         productId: BigInt(productId),
//         customerName,
//         review,
//         star: star !== undefined ? parseInt(star) : 0,
//         status: status || 'pending',
//         reviewTitle: reviewTitle || '',
//         author: author || 'administrator',
//       },
//     });

//     return new Response(
//       JSON.stringify({
//         success: true,
//         rating: convertBigInt_MI(newRating_MI),
//       }),
//       {
//         status: 200,
//         headers: corsHeaders,
//       }
//     );
//   } catch (error) {
//     return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
//       status: 500,
//       headers: corsHeaders,
//     });
//   }
// }


import { PrismaClient } from '@prisma/client';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

async function saveFile(file) {
  const uploadDir = join(process.cwd(), 'public', 'uploads');
  const uniqueName = `${uuidv4()}-${file.name}`;
  const filePath = join(uploadDir, uniqueName);
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));
  return `/uploads/${uniqueName}`;
}

function convertBigInt_MI(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString();
  
  if (Array.isArray(obj)) {
    return obj.map(convertBigInt_MI);
  }

  if (typeof obj === 'object') {
    const newObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        newObj[key] = convertBigInt_MI(obj[key]);
      }
    }
    return newObj;
  }

  return obj;
}

export async function action({ request }) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const formData = await request.formData();
    const shop = formData.get('shop');
    const productId = formData.get('productId');
    const customerName = formData.get('customerName');
    const review = formData.get('review');
    const star = formData.get('star');
    const status = formData.get('status');
    const reviewTitle = formData.get('reviewTitle');
    const author = formData.get('author');
    const mediaFiles = formData.getAll('media');

    if (!shop || !productId || !customerName || !review) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Validate and filter media files
    const validMediaFiles = mediaFiles.filter(file => 
      file.size > 0 && (file.type.startsWith('image/') || file.type.startsWith('video/'))
    );

    // Save files to public/uploads
    const mediaPaths = await Promise.all(
      validMediaFiles.map(file => saveFile(file))
    );

    const newRating_MI = await prisma.rating.create({
      data: {
        shop,
        productId: BigInt(productId),
        customerName,
        review,
        star: star !== undefined ? parseInt(star) : 0,
        status: status || 'pending',
        reviewTitle: reviewTitle || '',
        author: author || 'administrator',
        media: mediaPaths.length > 0 ? JSON.stringify(mediaPaths) : null,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        rating: convertBigInt_MI(newRating_MI),
      }),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error('Error creating rating:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  } finally {
    await prisma.$disconnect();
  }
}