/**
 * Browser Manager — singleton that manages a shared Playwright Chromium instance.
 * Reused across all collectors during a refresh job to avoid launching a new browser per provider.
 * 
 * Includes stealth/anti-detection measures to bypass bot protection (Akamai, Cloudflare, etc.)
 */

import { chromium, Browser, BrowserContext, Page } from 'playwright';

let browserInstance: Browser | null = null;
let contextInstance: BrowserContext | null = null;

const BROWSER_LAUNCH_OPTIONS = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    // Stealth: disable automation flags
    '--disable-blink-features=AutomationControlled',
    // Fix Spectrum HTTP/2 protocol error: force HTTP/1.1
    '--disable-http2',
    // Realistic browser behavior
    '--enable-features=NetworkService,NetworkServiceInProcess',
    '--disable-features=IsolateOrigins,site-per-process',
    '--window-size=1440,900',
    '--lang=en-US,en',
  ],
};

const CONTEXT_OPTIONS = {
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  viewport: { width: 1440, height: 900 },
  locale: 'en-US',
  timezoneId: 'America/New_York',
  bypassCSP: true,
  // Extra HTTP headers to look like a real browser
  extraHTTPHeaders: {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"macOS"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'Cache-Control': 'max-age=0',
  },
};

/**
 * Apply stealth patches to a page to evade bot detection.
 * Overrides common automation signals that WAFs (Akamai, Cloudflare) check.
 */
async function applyStealthScripts(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // 1. Override navigator.webdriver (primary bot detection signal)
    Object.defineProperty(navigator, 'webdriver', { get: () => false });

    // 2. Override chrome.runtime to appear as a real Chrome instance
    // @ts-ignore
    window.chrome = {
      runtime: {
        onMessage: { addListener: () => {}, removeListener: () => {} },
        sendMessage: () => {},
        connect: () => {},
      },
      loadTimes: () => ({}),
      csi: () => ({}),
    };

    // 3. Override permissions API
    const originalQuery = window.navigator.permissions?.query?.bind(window.navigator.permissions);
    if (originalQuery) {
      // @ts-ignore
      window.navigator.permissions.query = (parameters: any) => {
        if (parameters.name === 'notifications') {
          return Promise.resolve({ state: 'prompt', onchange: null } as PermissionStatus);
        }
        return originalQuery(parameters);
      };
    }

    // 4. Override plugins to appear non-empty
    Object.defineProperty(navigator, 'plugins', {
      get: () => {
        return [
          { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
          { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
          { name: 'Native Client', filename: 'internal-nacl-plugin', description: '' },
        ];
      },
    });

    // 5. Override languages
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });

    // 6. Override platform
    Object.defineProperty(navigator, 'platform', { get: () => 'MacIntel' });

    // 7. Override hardware concurrency
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });

    // 8. Override device memory
    // @ts-ignore
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });

    // 9. Fix WebGL renderer to look real
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function (parameter: number) {
      if (parameter === 37445) return 'Intel Inc.';
      if (parameter === 37446) return 'Intel Iris OpenGL Engine';
      return getParameter.call(this, parameter);
    };
  });
}

/**
 * Get or launch the shared browser instance.
 */
export async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }

  console.log('[browser-manager] Launching Chromium (stealth mode)...');
  browserInstance = await chromium.launch(BROWSER_LAUNCH_OPTIONS);
  console.log('[browser-manager] Chromium launched successfully');
  return browserInstance;
}

/**
 * Get or create a shared browser context (cookies/storage persist across pages).
 */
export async function getContext(): Promise<BrowserContext> {
  if (contextInstance) {
    return contextInstance;
  }

  const browser = await getBrowser();
  contextInstance = await browser.newContext(CONTEXT_OPTIONS);

  // Block heavy resources that don't affect text content
  // But do NOT block JavaScript — we need it for SPAs
  await contextInstance.route('**/*.{png,jpg,jpeg,gif,webp,ico,woff,woff2,ttf,eot}', (route) => route.abort());
  await contextInstance.route('**/*doubleclick*', (route) => route.abort());
  await contextInstance.route('**/*facebook.com*', (route) => route.abort());
  await contextInstance.route('**/*facebook.net*', (route) => route.abort());
  // Note: Do NOT block analytics/tracking broadly — some sites like AT&T use Akamai
  // scripts that double as anti-bot and will block content if their scripts don't load

  console.log('[browser-manager] Browser context created (stealth mode, images blocked)');
  return contextInstance;
}

/**
 * Open a new page, navigate to the URL, wait for content, and return the page.
 * The caller is responsible for closing the page when done.
 */
export async function openPage(
  url: string,
  options?: {
    waitForSelector?: string;     // CSS selector to wait for before considering page ready
    waitTimeoutMs?: number;       // Max time to wait for the page (default 45s)
    waitForNetworkIdle?: boolean; // Wait for network to be idle (default true)
  }
): Promise<Page> {
  const ctx = await getContext();
  const page = await ctx.newPage();
  const timeout = options?.waitTimeoutMs || 45000;

  // Apply stealth patches before any navigation
  await applyStealthScripts(page);

  try {
    console.log(`[browser-manager] Navigating to ${url}...`);
    
    // Navigate and wait for initial load
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout,
    });

    // Wait for network to settle (most JS apps load data via XHR)
    if (options?.waitForNetworkIdle !== false) {
      try {
        await page.waitForLoadState('networkidle', { timeout: 20000 });
      } catch {
        // networkidle timeout is non-fatal — some pages have persistent connections
        console.log(`[browser-manager] Network idle timeout for ${url} — proceeding anyway`);
      }
    }

    // Dismiss cookie/consent banners that might overlay content
    await dismissOverlays(page);

    // Wait for a specific content selector if provided
    if (options?.waitForSelector) {
      try {
        await page.waitForSelector(options.waitForSelector, { timeout: 10000 });
        console.log(`[browser-manager] Content selector "${options.waitForSelector}" found`);
      } catch {
        console.log(`[browser-manager] Content selector "${options.waitForSelector}" not found — proceeding with available content`);
      }
    }

    // Extra wait for JS rendering to complete
    await page.waitForTimeout(2500);

    // Try scrolling down to trigger lazy-loaded content
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 3);
    });
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      window.scrollTo(0, (document.body.scrollHeight * 2) / 3);
    });
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(500);

    console.log(`[browser-manager] Page loaded: ${url}`);
    return page;
  } catch (error) {
    await page.close().catch(() => {});
    throw error;
  }
}

/**
 * Dismiss common cookie consent banners, overlays, and modals.
 */
async function dismissOverlays(page: Page): Promise<void> {
  const dismissSelectors = [
    // Cookie consent buttons
    '#onetrust-accept-btn-handler',
    '[id*="cookie"] button[id*="accept"]',
    '[class*="cookie"] button[class*="accept"]',
    '[class*="consent"] button[class*="accept"]',
    'button[aria-label*="Accept"]',
    'button[aria-label*="accept"]',
    'button[aria-label*="Close"]',
    // Generic close/dismiss buttons on overlays
    '.modal-close', '.popup-close',
    '[data-dismiss="modal"]',
    'button[class*="close"][class*="banner"]',
    // AT&T specific
    '.lightbox-close',
    '#att-glob-nav-close',
  ];

  for (const selector of dismissSelectors) {
    try {
      const btn = await page.$(selector);
      if (btn && await btn.isVisible()) {
        await btn.click().catch(() => {});
        await page.waitForTimeout(300);
      }
    } catch {
      // Ignore — button might not exist
    }
  }
}

/**
 * Extract visible text content from a rendered page.
 * Uses DOM traversal to get structured text (preserves tables, headings, lists).
 */
export async function extractPageText(page: Page, contentSelector?: string): Promise<string> {
  const text = await page.evaluate((selector) => {
    // Focus on the content area if a selector is provided
    const root = selector ? document.querySelector(selector) || document.body : document.body;

    // Remove elements that add noise
    const removeSelectors = [
      'nav', 'footer', 'header',
      '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
      '.cookie-banner', '.chat-widget', '.modal', '.popup',
      '#onetrust-consent-sdk', '.onetrust-pc-dark-filter',
      'script', 'style', 'noscript', 'svg', 'iframe',
    ];
    
    // Clone to avoid modifying the actual DOM
    const clone = root.cloneNode(true) as HTMLElement;
    for (const sel of removeSelectors) {
      clone.querySelectorAll(sel).forEach(el => el.remove());
    }

    // Walk the DOM and extract structured text
    function extractText(node: Node, depth: number = 0): string {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim() || '';
        return text.length > 0 ? text : '';
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return '';
      const el = node as HTMLElement;

      // Skip hidden elements
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        return '';
      }

      const tag = el.tagName.toLowerCase();
      const children = Array.from(el.childNodes).map(c => extractText(c, depth + 1)).filter(t => t.length > 0);
      const childText = children.join(' ');

      if (!childText) return '';

      // Format based on element type
      switch (tag) {
        case 'h1': return `\n\n# ${childText}\n`;
        case 'h2': return `\n\n## ${childText}\n`;
        case 'h3': return `\n\n### ${childText}\n`;
        case 'h4': case 'h5': case 'h6': return `\n#### ${childText}\n`;
        case 'p': return `\n${childText}\n`;
        case 'li': return `\n- ${childText}`;
        case 'br': return '\n';
        case 'hr': return '\n---\n';
        case 'td': case 'th': return ` | ${childText}`;
        case 'tr': return `\n${childText} |`;
        case 'table': return `\n${childText}\n`;
        case 'div': case 'section': case 'article': case 'main':
          return `\n${childText}\n`;
        default:
          return childText;
      }
    }

    let result = extractText(clone);

    // Clean up whitespace
    result = result.replace(/[ \t]+/g, ' ');
    result = result.replace(/\n\s*\n\s*\n/g, '\n\n');
    result = result.trim();

    return result;
  }, contentSelector || null);

  // Truncate to 20,000 chars to capture more pricing data
  if (text.length > 20000) {
    return text.substring(0, 20000) + '\n\n[Content truncated for analysis]';
  }

  return text;
}

/**
 * Gracefully close the browser and context.
 * Call this at the end of a refresh job.
 */
export async function closeBrowser(): Promise<void> {
  if (contextInstance) {
    await contextInstance.close().catch(() => {});
    contextInstance = null;
  }
  if (browserInstance) {
    await browserInstance.close().catch(() => {});
    browserInstance = null;
    console.log('[browser-manager] Browser closed');
  }
}
