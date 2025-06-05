import { useEffect } from 'react';

export default function Enableratingfy_MI() {
  useEffect(() => {
    try {
      const searchParams_MI = new URLSearchParams(window.location.search);
      const shop_MI = searchParams_MI.get('shop') || sessionStorage.getItem('shop');
      if (shop_MI) {
        const storeName_MI = shop_MI.split('.')[0];
        window.open(`https://admin.shopify.com/store/${storeName_MI}/themes/current/editor?template=product`, '_top');
      } else {
        const hasReloaded_MI = sessionStorage.getItem('hasReloaded');
        if (!hasReloaded_MI) {
          sessionStorage.setItem('hasReloaded', 'true');
          window.location.reload();
          const searchParams_MI = new URLSearchParams(window.location.search);
          const shop_MI = searchParams_MI.get('shop') || sessionStorage.getItem('shop');
          if (shop_MI) {
            const storeName_MI = shop_MI.split('.')[0];
            window.open(`https://admin.shopify.com/store/${storeName_MI}/themes/current/editor?template=product`, '_top');
          } 
        } 
      }
    } catch (error_MI) {
    }
  }, []);

  return null;
}