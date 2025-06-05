import { json } from '@remix-run/node';
import { authenticate } from '../shopify.server';

const corsHeaders_MI = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function loader({ request }) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders_MI });
  }

  const url_MI = new URL(request.url);
  const shop_MI = url_MI.searchParams.get('shop');

  if (!shop_MI) {
    return json({ error: 'Missing shop parameter' }, { status: 400, headers: corsHeaders_MI });
  }

  try {
    const { admin } = await authenticate.admin(request);
    const query_MI = `
      query {
        products(first: 100) {
          edges {
            node {
              id
              title
            }
          }
        }
      }
    `;

    const response_MI = await admin.graphql(query_MI);
    const data_MI = await response_MI.json();

    if (data_MI.errors) {
      return json({ error: 'GraphQL error', details: data_MI.errors }, { status: 500, headers: corsHeaders_MI });
    }

    const products_MI = data_MI?.data?.products?.edges?.map((edge) => {
      const id_MI = edge.node.id.split('/').pop();
      return {
        id: id_MI,
        title: edge.node.title,
      };
    }) || [];

    return json({ products: products_MI }, { status: 200, headers: corsHeaders_MI });
  } catch (error) {
    return json({ error: error.message || 'Internal server error' }, { status: 500, headers: corsHeaders_MI });
  }
}