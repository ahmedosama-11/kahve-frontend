const https = require('https');

const SITE_URL = 'https://www.kahve-egy.com';
const STORE_NAME = 'KAHVE Egypt';
const BRAND_NAME = 'KAHVE';
const CURRENCY = 'EGP';
const GOOGLE_COFFEE_CATEGORY_ID = '1868';
const API_BASE_URL = String(
  process.env.KAHVE_API_BASE_URL ||
  process.env.API_BASE_URL ||
  'https://kahve-backend.vercel.app',
).replace(/\/+$/, '');

function cleanText(value, maxLength = 5000) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function xmlEscape(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function slugify(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 90) || 'kahve-product';
}

function getProductId(product) {
  return cleanText(
    product?._id || product?.id || product?.productId || product?.SKU || product?.sku,
    50,
  );
}

function getProductPath(product) {
  const id = getProductId(product);
  if (!id) return '';
  const title = product?.title_en || product?.title || product?.name || product?.title_ar || 'kahve-product';
  return `/product/${encodeURIComponent(id)}/${encodeURIComponent(slugify(title))}`;
}

function absoluteUrl(value, baseUrl = SITE_URL) {
  const url = cleanText(value, 2000);
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('//')) return `https:${url}`;
  return `${baseUrl.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`;
}

function extractProducts(data) {
  const products = Array.isArray(data)
    ? data
    : data?.products || data?.data?.products || data?.data || data?.result || [];
  return Array.isArray(products) ? products : [];
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'KAHVE-Merchant-Feed/1.0',
      },
    }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => {
        if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`Home API returned ${response.statusCode || 'unknown status'}`));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(new Error(`Home API returned invalid JSON: ${error.message}`));
        }
      });
    });

    request.setTimeout(12000, () => {
      request.destroy(new Error('Home API request timed out'));
    });
    request.on('error', reject);
  });
}

function getTitle(product) {
  return cleanText(
    product?.title_en || product?.name_en || product?.title || product?.name || product?.title_ar,
    150,
  );
}

function getCategory(product) {
  return cleanText(
    product?.category_en || product?.category || product?.productType || product?.category_ar || 'Coffee',
    750,
  );
}

function getDescription(product, title, category) {
  const description = cleanText(
    product?.description_en || product?.description || product?.details || product?.description_ar,
    5000,
  );
  if (description) return description;
  return cleanText(`${title} from KAHVE Egypt. Premium ${category || 'coffee'} available for online ordering in Egypt.`, 5000);
}

function getPrice(product) {
  const value = Number(product?.price ?? product?.salesPrice ?? product?.sale_price ?? 0);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function getQuantity(product) {
  const value = Number(product?.Quantity ?? product?.quantity ?? product?.stock ?? 0);
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function validGtin(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (![8, 12, 13, 14].includes(digits.length)) return '';
  if (/^(\d)\1+$/.test(digits)) return '';

  const body = digits.slice(0, -1);
  const checkDigit = Number(digits.at(-1));
  let sum = 0;
  let weight = 3;
  for (let index = body.length - 1; index >= 0; index -= 1) {
    sum += Number(body[index]) * weight;
    weight = weight === 3 ? 1 : 3;
  }
  const calculated = (10 - (sum % 10)) % 10;
  return calculated === checkDigit ? digits : '';
}

function getIdentifierFields(product, id) {
  const possibleBarcode = product?.gtin || product?.GTIN || product?.barcode || product?.Barcode || product?.code;
  const gtin = validGtin(possibleBarcode);
  if (gtin) return `\n      <g:gtin>${xmlEscape(gtin)}</g:gtin>`;

  const mpn = cleanText(product?.MPN || product?.mpn || product?.SKU || product?.sku || product?.code || id, 70);
  return mpn ? `\n      <g:mpn>${xmlEscape(mpn)}</g:mpn>` : '';
}

function buildItem(product) {
  const id = getProductId(product);
  const title = getTitle(product);
  const category = getCategory(product);
  const description = getDescription(product, title, category);
  const productPath = getProductPath(product);
  const link = productPath ? `${SITE_URL}${productPath}` : '';
  const imageLink = absoluteUrl(product?.image || product?.image_url || product?.imageUrl || product?.secure_url, API_BASE_URL);
  const price = getPrice(product);
  const quantity = getQuantity(product);

  if (!id || !title || !link || !imageLink || !price) return '';

  const identifierFields = getIdentifierFields(product, id);
  return `    <item>
      <g:id>${xmlEscape(id)}</g:id>
      <g:title>${xmlEscape(title)}</g:title>
      <g:description>${xmlEscape(description)}</g:description>
      <g:link>${xmlEscape(link)}</g:link>
      <g:image_link>${xmlEscape(imageLink)}</g:image_link>
      <g:availability>${quantity > 0 ? 'in_stock' : 'out_of_stock'}</g:availability>
      <g:price>${price.toFixed(2)} ${CURRENCY}</g:price>
      <g:condition>new</g:condition>
      <g:brand>${BRAND_NAME}</g:brand>${identifierFields}
      <g:google_product_category>${GOOGLE_COFFEE_CATEGORY_ID}</g:google_product_category>
      <g:product_type>${xmlEscape(category)}</g:product_type>
    </item>`;
}

function buildFeed(products) {
  const items = products.map(buildItem).filter(Boolean);
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>${STORE_NAME} Product Feed</title>
    <link>${SITE_URL}</link>
    <description>Live product data for ${STORE_NAME}</description>
${items.join('\n')}
  </channel>
</rss>
`;
}

module.exports = async function merchantFeedHandler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const data = await fetchJson(`${API_BASE_URL}/home`);
    const products = extractProducts(data);
    const xml = buildFeed(products);

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('X-KAHVE-Feed-Items', String(products.length));
    res.status(200).send(req.method === 'HEAD' ? '' : xml);
  } catch (error) {
    console.error('Merchant feed product fetch failed:', error);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.status(503).send('Product feed is temporarily unavailable.');
  }
};
