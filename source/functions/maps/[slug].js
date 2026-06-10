const MAPS_JSON_URL =
  'https://raw.githubusercontent.com/imnotkoolkid/KCH/refs/heads/main/data/maps.json';

const SITE_URL = 'https://kirkacommunityhub.pages.dev';
const FALLBACK_IMG = `${SITE_URL}/assets/icon.png`;

const slugToTitle = (s) =>
  decodeURIComponent(s).replace(/-/g, ' ').toLowerCase();

const escapeHtml = (str) =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

function isBotRequest(request) {
  const ua = (request.headers.get('user-agent') || '').toLowerCase();
  const botKeywords = [
    'bot', 'crawler', 'spider', 'slurp', 'facebookexternalhit',
    'twitterbot', 'linkedinbot', 'discordbot', 'telegrambot',
    'whatsapp', 'slackbot', 'embedly', 'curl', 'wget',
    'python-requests', 'go-http-client', 'java/', 'okhttp',
  ];
  return botKeywords.some((k) => ua.includes(k));
}

function buildOgHtml({ name, image, slug }) {
  const ogTitle = escapeHtml(`${name}`);
  const ogImage = escapeHtml(image || FALLBACK_IMG);
  const ogUrl = escapeHtml(`${SITE_URL}/maps/${slug}`);
  const canonical = escapeHtml(`${SITE_URL}/maps.html#${encodeURIComponent(slug)}`);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${ogTitle}</title>
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Kirka Community Hub">
  <meta property="og:url" content="${ogUrl}">
  <meta property="og:title" content="${ogTitle}">
  <meta property="og:image" content="${ogImage}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${ogTitle}">
  <meta name="twitter:image" content="${ogImage}">

  <meta name="theme-color" content="#1bd96a">

  <link rel="canonical" href="${canonical}">

  <script>
    window.location.replace(${JSON.stringify(`${SITE_URL}/maps.html#${slug}`)});
  </script>
</head>
<body>
  <p>Redirecting… <a href="${canonical}">Click here</a></p>
</body>
</html>`;
}

export async function onRequestGet(context) {
  const { params, request } = context;
  const slug = params.slug || '';

  if (!isBotRequest(request)) {
    return Response.redirect(
      `${SITE_URL}/maps.html#${encodeURIComponent(slug)}`,
      302
    );
  }

  try {
    const res = await fetch(MAPS_JSON_URL, {
      headers: { 'User-Agent': 'KCH-OG-Worker/1.0' },
      cf: { cacheTtl: 300, cacheEverything: true },
    });

    if (!res.ok) throw new Error(`JSON fetch failed: ${res.status}`);

    const items = await res.json();
    const targetTitle = slugToTitle(slug);
    const item = items.find(
      (i) => i.name.trim().toLowerCase() === targetTitle
    );

    if (!item) {
      return Response.redirect(`${SITE_URL}/maps.html`, 302);
    }

    const html = buildOgHtml({
      name: item.name,
      image: item.img || '',
      slug,
    });

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    });
  } catch (err) {
    console.error('OG worker error:', err);
    return Response.redirect(`${SITE_URL}/maps.html`, 302);
  }
}
