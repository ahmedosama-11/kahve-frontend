const https = require('https');

const SITE_URL = 'https://www.kahve-egy.com';
const API_BASE_URL = String(
  process.env.KAHVE_API_BASE_URL ||
  process.env.API_BASE_URL ||
  'https://kahve-backend.vercel.app',
).replace(/\/+$/, '');

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
  return String(product?._id || product?.id || product?.productId || product?.SKU || product?.sku || '').trim();
}

function getProductPath(product) {
  const id = getProductId(product);
  if (!id) return '';
  const title = product?.title_en || product?.title || product?.name || product?.title_ar || 'kahve-product';
  return `/product/${encodeURIComponent(id)}/${encodeURIComponent(slugify(title))}`;
}

function getCategoryName(category) {
  return String(
    category?.name_en ||
    category?.name ||
    category?.category_en ||
    category?.category ||
    category?.name_ar ||
    category?.category_ar ||
    '',
  ).trim();
}

function getCategoryPath(category) {
  const name = getCategoryName(category);
  if (!name) return '';
  return `/category/${encodeURIComponent(slugify(name))}`;
}

function extractProducts(data) {
  const products = Array.isArray(data)
    ? data
    : data?.products || data?.data?.products || data?.data || data?.result || [];
  return Array.isArray(products) ? products : [];
}

function extractCategories(data, products) {
  const responseCategories = data?.categories || data?.data?.categories || [];
  if (Array.isArray(responseCategories) && responseCategories.length) {
    return responseCategories.filter((category) => category?.isActive !== false && category?.showInHome !== false);
  }

  const map = new Map();
  for (const product of products) {
    const nameEn = String(product?.category_en || product?.category || product?.categoryId?.name_en || '').trim();
    const nameAr = String(product?.category_ar || product?.categoryId?.name_ar || nameEn).trim();
    if (!nameEn) continue;
    const key = slugify(nameEn);
    if (!key || map.has(key)) continue;
    map.set(key, {
      name_en: nameEn,
      name_ar: nameAr,
      updatedAt: product?.updatedAt || product?.createdAt,
    });
  }
  return Array.from(map.values());
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'KAHVE-Sitemap/1.0',
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

    request.setTimeout(9000, () => {
      request.destroy(new Error('Home API request timed out'));
    });
    request.on('error', reject);
  });
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function validLastModified(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function urlEntry(location, options = {}) {
  const lastmod = options.lastmod ? `\n    <lastmod>${xmlEscape(options.lastmod)}</lastmod>` : '';
  const changefreq = options.changefreq ? `\n    <changefreq>${options.changefreq}</changefreq>` : '';
  const priority = options.priority ? `\n    <priority>${options.priority}</priority>` : '';
  return `  <url>\n    <loc>${xmlEscape(location)}</loc>${lastmod}${changefreq}${priority}\n  </url>`;
}

function buildSitemap(products, categories) {
  const entries = [
    urlEntry(`${SITE_URL}/`, { changefreq: 'weekly', priority: '1.0' }),
    urlEntry(`${SITE_URL}/home`, { changefreq: 'daily', priority: '0.9' }),
    urlEntry(`${SITE_URL}/aboutUs`, { changefreq: 'monthly', priority: '0.7' }),
    urlEntry(`${SITE_URL}/contactUs`, { changefreq: 'monthly', priority: '0.6' }),
    urlEntry(`${SITE_URL}/shipping-policy`, { changefreq: 'monthly', priority: '0.5' }),
    urlEntry(`${SITE_URL}/returns-refunds`, { changefreq: 'monthly', priority: '0.5' }),
    urlEntry(`${SITE_URL}/privacy-policy`, { changefreq: 'yearly', priority: '0.4' }),
    urlEntry(`${SITE_URL}/terms-conditions`, { changefreq: 'yearly', priority: '0.4' }),
  ];

  const seenCategories = new Set();
  for (const category of categories) {
    const path = getCategoryPath(category);
    if (!path || seenCategories.has(path)) continue;
    seenCategories.add(path);

    const lastmod = validLastModified(category?.updatedAt || category?.createdAt);
    entries.push(urlEntry(`${SITE_URL}${path}`, {
      lastmod,
      changefreq: 'weekly',
      priority: '0.75',
    }));
  }

  const seen = new Set();
  for (const product of products) {
    const path = getProductPath(product);
    if (!path || seen.has(path)) continue;
    seen.add(path);

    const lastmod = validLastModified(product?.updatedAt || product?.createdAt);
    entries.push(urlEntry(`${SITE_URL}${path}`, {
      lastmod,
      changefreq: 'weekly',
      priority: '0.8',
    }));
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;
}

module.exports = async function sitemapHandler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    res.status(405).send('Method Not Allowed');
    return;
  }

  let products = [];
  let categories = [];
  try {
    const data = await fetchJson(`${API_BASE_URL}/home`);
    products = extractProducts(data);
    categories = extractCategories(data, products);
  } catch (error) {
    console.error('Sitemap catalog fetch failed:', error);
  }

  const xml = buildSitemap(products, categories);
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(req.method === 'HEAD' ? '' : xml);
};
