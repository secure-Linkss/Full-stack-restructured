/**
 * useSEO — Zero-dependency SEO hook.
 * Sets document.title, meta tags, Open Graph, Twitter Card, and JSON-LD
 * structured data on every route change. Works without react-helmet.
 */
import { useEffect } from 'react';

const APP_NAME = 'Brain Link Tracker';
const APP_URL = typeof window !== 'undefined' ? window.location.origin : 'https://brain-link-tracker-v2.vercel.app';
const DEFAULT_IMAGE = `${APP_URL}/favicon.png`;

function setMeta(name, content, attr = 'name') {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel, href, extra = {}) {
  if (!href) return;
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
  Object.entries(extra).forEach(([k, v]) => el.setAttribute(k, v));
}

function injectJsonLd(id, data) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

/**
 * @param {Object} opts
 * @param {string} opts.title          Page title (appended with " | Brain Link Tracker")
 * @param {string} opts.description    Meta description (max ~160 chars)
 * @param {string} [opts.keywords]     Comma-separated keywords
 * @param {string} [opts.canonical]    Canonical URL path (e.g. "/pricing")
 * @param {string} [opts.image]        OG image URL
 * @param {'website'|'article'} [opts.type]  OG type
 * @param {Object} [opts.jsonLd]       Custom JSON-LD schema (replaces default)
 * @param {boolean} [opts.noIndex]     Set robots noindex,nofollow
 */
export function useSEO({
  title,
  description,
  keywords,
  canonical,
  image,
  type = 'website',
  jsonLd,
  noIndex = false,
} = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${APP_NAME}` : APP_NAME;
    const ogImage = image || DEFAULT_IMAGE;
    const canonicalUrl = canonical ? `${APP_URL}${canonical}` : APP_URL + window.location.pathname;

    // Title
    document.title = fullTitle;

    // Standard meta
    setMeta('description', description);
    setMeta('keywords', keywords);
    setMeta('robots', noIndex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large');
    setMeta('author', APP_NAME);
    setMeta('theme-color', '#3b82f6');

    // Open Graph
    setMeta('og:title', fullTitle, 'property');
    setMeta('og:description', description, 'property');
    setMeta('og:url', canonicalUrl, 'property');
    setMeta('og:type', type, 'property');
    setMeta('og:image', ogImage, 'property');
    setMeta('og:image:alt', title || APP_NAME, 'property');
    setMeta('og:site_name', APP_NAME, 'property');
    setMeta('og:locale', 'en_GB', 'property');

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', description);
    setMeta('twitter:image', ogImage);

    // Canonical
    setLink('canonical', canonicalUrl);

    // JSON-LD structured data
    const schema = jsonLd || {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: fullTitle,
      description,
      url: canonicalUrl,
      publisher: {
        '@type': 'Organization',
        name: APP_NAME,
        url: APP_URL,
        logo: {
          '@type': 'ImageObject',
          url: DEFAULT_IMAGE,
        },
      },
    };
    injectJsonLd('json-ld-page', schema);

    return () => {
      // Reset to defaults on unmount
      document.title = APP_NAME;
    };
  }, [title, description, keywords, canonical, image, type, noIndex, JSON.stringify(jsonLd)]);
}

export default useSEO;
