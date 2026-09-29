// Vercel Serverless Function: /api/image-proxy?url=<image url>
// Replaces the Express route in server.ts (Vercel does not run server.ts).
const PLACEHOLDER_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#cbd5e1"/><circle cx="100" cy="78" r="34" fill="#94a3b8"/><path d="M36 190c0-36 28-60 64-60s64 24 64 60z" fill="#94a3b8"/></svg>';

function sendPlaceholder(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.status(200).send(PLACEHOLDER_SVG);
}

export default async function handler(req, res) {
  try {
    let imageUrl = req.query.url;
    if (Array.isArray(imageUrl)) imageUrl = imageUrl[0];
    if (!imageUrl) return res.status(400).send('Missing image URL');

    // Handle nested proxy URLs
    while (imageUrl.includes('/api/image-proxy?url=')) {
      const parts = imageUrl.split('/api/image-proxy?url=');
      imageUrl = decodeURIComponent(parts[parts.length - 1]);
    }
    if (!/^https?:\/\//i.test(imageUrl)) return res.status(400).send('Invalid image URL');

    // Heal known legacy broken pic.in.th URLs
    imageUrl = imageUrl
      .replace('https://img2.pic.in.th/images/BME_563770..045756.png', 'https://img2.pic.in.th/BME_563770..045756.png')
      .replace('https://img1.pic.in.th/images/BME_603892..045611.png', 'https://img2.pic.in.th/BME_603892..045611.png')
      .replace('https://img2.pic.in.th/images/BME_563779..045629.png', 'https://img1.pic.in.th/images/BME_563779..045629.png')
      .replace('https://img2.pic.in.th/images/BME_606675..045820.png', 'https://img2.pic.in.th/BME_606675..045820.png')
      .replace('https://img2.pic.in.th/images/BME_612366..045835.png', 'https://img2.pic.in.th/BME_612366..045835.png')
      .replace('https://img2.pic.in.th/S__6471705_0-removebg-preview.png', 'https://img1.pic.in.th/images/970d1e089ad78d07db702e1eab5698c6.png');

    // Google Drive links
    if (imageUrl.includes('drive.google.com')) {
      const m = imageUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || imageUrl.match(/id=([a-zA-Z0-9_-]+)/);
      if (m && m[1]) imageUrl = `https://drive.google.com/thumbnail?id=${m[1]}&sz=w1000`;
    }

    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
    };
    if (imageUrl.includes('pic.in.th')) headers['Referer'] = 'https://pic.in.th/';

    const safeUrl = imageUrl.includes('..') ? imageUrl.replace(/\.\./g, '%2E%2E') : imageUrl;

    let response = await fetch(safeUrl, { redirect: 'follow', headers });
    if (!response.ok) response = await fetch(safeUrl, { redirect: 'follow' });
    if (!response.ok && safeUrl !== imageUrl) response = await fetch(imageUrl, { redirect: 'follow', headers });
    if (!response.ok) return sendPlaceholder(res);

    const contentType = response.headers.get('content-type') || 'image/png';
    const buffer = Buffer.from(await response.arrayBuffer());

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', contentType.includes('image') ? contentType : 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    return res.status(200).send(buffer);
  } catch (err) {
    return sendPlaceholder(res);
  }
}
