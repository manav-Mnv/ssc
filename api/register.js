const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Rate limiting in-memory map (per-instance)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS = 3;

// Cloudflare Turnstile Secret Key (Fallback to dummy testing key if not set)
const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || "1x0000000000000000000000000000000AA";

// Daily Instant Email Safety Threshold
const DAILY_INSTANT_LIMIT = 450;

// Helper to check rate limit
function checkRateLimit(ip) {
  const now = Date.now();
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, firstRequest: now });
    return true;
  }

  const record = rateLimitMap.get(ip);
  if (now - record.firstRequest > RATE_LIMIT_WINDOW_MS) {
    // Reset window
    rateLimitMap.set(ip, { count: 1, firstRequest: now });
    return true;
  }

  if (record.count >= MAX_REQUESTS) {
    return false; // Rate limit exceeded
  }

  record.count += 1;
  return true;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 1. IP Rate Limiting
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: "Too many requests. Please try again later." });
  }

  const { rowData, row, turnstileResponse } = req.body || {};
  const rowPayload = rowData || row;
  const email = rowPayload?.email;
  const full_name = rowPayload?.full_name;

  if (!email || !rowPayload) {
    return res.status(400).json({ error: "Missing required registration data." });
  }

  if (!turnstileResponse) {
    return res.status(400).json({ error: "CAPTCHA validation failed. Please refresh and try again." });
  }

  // 2. CAPTCHA Verification
  try {
    const cfVerify = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: TURNSTILE_SECRET_KEY,
        response: turnstileResponse,
        remoteip: ip,
      }),
    });
    
    const cfResult = await cfVerify.json();
    if (!cfResult.success) {
      console.warn("Turnstile failed:", cfResult);
      return res.status(400).json({ error: "CAPTCHA verification failed. Are you a bot?" });
    }
  } catch (err) {
    console.error("Turnstile error:", err);
    return res.status(500).json({ error: "Error verifying CAPTCHA." });
  }

  // 3. Supabase Insertion
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: "Supabase credentials not configured." });
  }
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let insertedId = null;
  try {
    const { data, error } = await supabase
      .from("registrations")
      .insert([rowPayload])
      .select("id");

    if (error) {
      if (error.code === "23505") { // Unique constraint violation
        return res.status(409).json({ error: "You have already registered with this email." });
      }
      throw error;
    }
    insertedId = data[0].id;
  } catch (err) {
    console.error("Supabase insert error:", err);
    return res.status(500).json({ error: "Database error during registration." });
  }

  // 4. Send Email
  try {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const { count: sentTodayCount } = await supabase
      .from("registrations")
      .select("id", { count: "exact", head: true })
      .eq("email_sent", true)
      .gte("created_at", todayStart.toISOString());

    if (typeof sentTodayCount === "number" && sentTodayCount >= DAILY_INSTANT_LIMIT) {
      return res.status(200).json({ status: "queued", message: "Registration successful. Email queued." });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "465"),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const first = (full_name || "Student").trim().split(" ")[0].replace(/[&<>"']/g, "");
    const uniqueHash = crypto.randomBytes(4).toString("hex").toUpperCase();
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Swift Student Challenge 2027</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f5; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5; padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%; background-color:#ffffff; border-radius:16px; overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:36px 32px 0 32px;">
              <p style="margin:0; font-size:12px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; color:#8b8b93;">
                Swift Coding Club &middot; Parul University
              </p>
              <h1 style="margin:8px 0 0 0; font-size:22px; line-height:1.3; font-weight:700; color:#111114;">
                You're registered for SSC 2027 🎉
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:20px 32px 0 32px;">
              <p style="margin:0 0 14px 0; font-size:15px; line-height:1.6; color:#3a3a3e;">
                Hi <strong style="color:#111114;">${first}</strong>,
              </p>
              <p style="margin:0 0 14px 0; font-size:15px; line-height:1.6; color:#3a3a3e;">
                We've received your registration for the <strong>Swift Student Challenge 2027</strong>. Our mentor team is reviewing your app playground idea now.
              </p>
              <p style="margin:0; font-size:15px; line-height:1.6; color:#3a3a3e;">
                You'll hear from us soon with workshop schedules and challenge guidance.
              </p>
            </td>
          </tr>

          <!-- Status pill -->
          <tr>
            <td style="padding:24px 32px 0 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="background-color:#f0f9f1; border-radius:10px; width:100%;">
                <tr>
                  <td style="padding:14px 16px; font-size:14px; color:#1e7a34; font-weight:600;">
                    ✓ Registration verified &amp; received
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:28px 32px 0 32px;">
              <hr style="border:none; border-top:1px solid #ececef; margin:0;" />
            </td>
          </tr>

          <!-- Social links -->
          <tr>
            <td style="padding:24px 32px 0 32px;">
              <p style="margin:0 0 12px 0; font-size:13px; font-weight:600; color:#111114;">
                Stay connected
              </p>
              <table role="presentation" cellpadding="0" cellspacing="6">
                <tr>
                  <td>
                    <a href="https://chat.whatsapp.com/FXLcmWvxJbP24jZIn4B3Il" style="display:inline-block; padding:9px 14px; background-color:#111114; color:#ffffff; font-size:13px; font-weight:600; text-decoration:none; border-radius:20px;">WhatsApp Community</a>
                  </td>
                  <td>
                    <a href="https://whatsapp.com/channel/0029VbDO8OGD8SE0NtyZbN3h" style="display:inline-block; padding:9px 14px; background-color:#111114; color:#ffffff; font-size:13px; font-weight:600; text-decoration:none; border-radius:20px;">WhatsApp Channel</a>
                  </td>
                </tr>
                <tr>
                  <td>
                    <a href="https://www.instagram.com/swiftcodingclub_pu/" style="display:inline-block; padding:9px 14px; background-color:#111114; color:#ffffff; font-size:13px; font-weight:600; text-decoration:none; border-radius:20px;">Instagram</a>
                  </td>
                  <td>
                    <a href="https://www.linkedin.com/company/scc-pu/" style="display:inline-block; padding:9px 14px; background-color:#111114; color:#ffffff; font-size:13px; font-weight:600; text-decoration:none; border-radius:20px;">LinkedIn</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 32px 32px 32px;">
              <p style="margin:0; font-size:12px; color:#a9a9b0;">
                Ref ID: #${uniqueHash} &middot; Swift Coding Club, Parul University
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Swift Coding Club" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Registration Confirmed — Swift Student Challenge 2027",
      html: html,
    });

    await supabase.from("registrations").update({ email_sent: true }).eq("id", insertedId);

    return res.status(200).json({ status: "sent", message: "Registration successful. Email sent!" });
  } catch (err) {
    console.error("Instant email error:", err);
    return res.status(200).json({ status: "queued", message: "Registration successful. Email queued." });
  }
};
