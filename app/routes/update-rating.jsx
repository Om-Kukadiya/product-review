import { PrismaClient } from '@prisma/client';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT", // Added PUT
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

async function saveFile(file) {
  const uploadDir = join(process.cwd(), 'public', 'uploads');
  // Consider creating uploadDir if it doesn't exist, though add-rating.jsx might handle this
  const uniqueName = `${uuidv4()}-${file.name}`;
  const filePath = join(uploadDir, uniqueName);
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));
  return `/uploads/${uniqueName}`; // Relative path for client access
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

  // The frontend sends POST for updates, ensure this matches or update frontend
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const formData = await request.formData();
    const id = formData.get('id');
    const customerName = formData.get('customerName');
    const customerEmail = formData.get('customerEmail');
    const review = formData.get('review');
    const star = formData.get('star');
    const status = formData.get('status');
    const reviewTitle = formData.get('reviewTitle');
    const existingMediaString = formData.get('existingMedia'); // This will be a JSON string
    const newMediaFiles = formData.getAll('media'); // Array of File objects

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing rating ID' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    let existingMediaPaths = [];
    if (existingMediaString) {
      try {
        existingMediaPaths = JSON.parse(existingMediaString);
        if (!Array.isArray(existingMediaPaths)) {
          console.warn('existingMedia was not an array after parsing:', existingMediaPaths);
          existingMediaPaths = []; // Default to empty if not an array
        }
      } catch (e) {
        console.error('Failed to parse existingMedia:', e);
        // existingMediaPaths remains []
      }
    }
    
    // Validate and filter new media files
    const validNewMediaFiles = newMediaFiles.filter(file =>
      file.size > 0 && (file.type.startsWith('image/') || file.type.startsWith('video/'))
    );

    // Save new files and get their paths
    const newMediaPaths = await Promise.all(
      validNewMediaFiles.map(file => saveFile(file))
    );

    // Combine existing and new media paths
    const allMediaPaths = [...existingMediaPaths, ...newMediaPaths];

    const updateData = {
      customerName,
      customerEmail,
      review,
      star: star !== undefined ? parseInt(star) : undefined, // Keep undefined if not provided
      status: status || 'pending',
      reviewTitle: reviewTitle || '',
      media: allMediaPaths.length > 0 ? JSON.stringify(allMediaPaths) : null,
    };

    // Remove undefined fields from updateData to avoid Prisma errors
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const updated_MI = await prisma.rating.update({
      where: { id: Number(id) }, // Changed BigInt(id) to Number(id)
      data: updateData,
    });

    return new Response(
      JSON.stringify({
        success: true,
        rating: convertBigInt_MI(updated_MI),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error('Error updating rating:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  } finally {
    await prisma.$disconnect();
  }
}