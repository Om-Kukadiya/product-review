import { PrismaClient } from "@prisma/client";

const prisma_MI = new PrismaClient();

const corsHeaders_MI = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function action({ request }) {
  try {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders_MI,
      });
    }

    if (request.method !== "POST" && request.method !== "GET") {
      return new Response(
        JSON.stringify({ error: "Method not allowed. Please use POST or GET." }),
        { status: 405, headers: corsHeaders_MI }
      );
    }

    const requestBody_MI = await request.json();
    const { product_id, star, customer_name, reviewTitle, review, shop, isLoggedIn } = requestBody_MI;

    if (!product_id || !customer_name || !review || !reviewTitle) {
      return new Response(
        JSON.stringify({ error: "Please fill in all required fields." }),
        { status: 400, headers: corsHeaders_MI }
      );
    }

    if (star === undefined || star < 1 || star > 5) {
      return new Response(
        JSON.stringify({ error: "Please provide a star rating between 1 and 5." }),
        { status: 400, headers: corsHeaders_MI }
      );
    }

    const bigIntProductId_MI = BigInt(product_id);
    const starRating_MI = parseInt(star);
    const author_MI = isLoggedIn ? "customer" : "guest";

    if (isLoggedIn) {
      const existingReview_MI = await prisma_MI.rating.findFirst({
        where: {
          productId: bigIntProductId_MI,
          shop,
          customerName: customer_name.trim(),
          author: "customer",
        },
      });

      if (existingReview_MI) {
        return new Response(
          JSON.stringify({ error: "You have already submitted a review for this product." }),
          { status: 400, headers: corsHeaders_MI }
        );
      }
    }

    const newReview_MI = await prisma_MI.rating.create({
      data: {
        shop,
        productId: bigIntProductId_MI,
        star: starRating_MI,
        customerName: customer_name.trim(),
        reviewTitle: reviewTitle.trim(),
        review: review.trim(),
        author: author_MI,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Review submitted successfully",
        review: {
          id: newReview_MI.id,
          shop: newReview_MI.shop,
          productId: newReview_MI.productId.toString(),
          star: newReview_MI.star,
          customerName: newReview_MI.customerName,
          reviewTitle: newReview_MI.reviewTitle,
          review: newReview_MI.review,
          author: newReview_MI.author,
          createdAt: newReview_MI.createdAt,
        },
      }),
      { status: 201, headers: corsHeaders_MI }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: corsHeaders_MI }
    );
  }
}