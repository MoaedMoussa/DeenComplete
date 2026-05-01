import { Router } from "express";

const router = Router();
const SUNNAH_KEY = "SqD712P3E82xnwOAEOkGd5JZXwal9ruparT4zwdi";
const SUNNAH_BASE = "https://api.sunnah.com/v1";

// Proxy sunnah.com — forwards sub-path + query, adds API key
router.get(/^\/hadith\/(.+)$/, async (req, res) => {
  const subPath = (req.params as unknown as string[])[0] ?? "";
  const queryStr = new URLSearchParams(req.query as Record<string, string>).toString();
  const url = `${SUNNAH_BASE}/${subPath}${queryStr ? "?" + queryStr : ""}`;

  try {
    const upstream = await fetch(url, {
      headers: { "X-API-Key": SUNNAH_KEY },
    });
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    req.log.error({ err }, "Hadith proxy error");
    res.status(502).json({ error: "Upstream request failed" });
  }
});

// Proxy alquran.cloud — avoids any potential CORS issues on web
router.get(/^\/quran\/(.+)$/, async (req, res) => {
  const subPath = (req.params as unknown as string[])[0] ?? "";
  const queryStr = new URLSearchParams(req.query as Record<string, string>).toString();
  const url = `https://api.alquran.cloud/v1/${subPath}${queryStr ? "?" + queryStr : ""}`;

  try {
    const upstream = await fetch(url);
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    req.log.error({ err }, "Quran proxy error");
    res.status(502).json({ error: "Upstream request failed" });
  }
});

export default router;
