const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Daily Instant Email Safety Threshold (Google SMTP limit is 500/day)
const DAILY_INSTANT_LIMIT = 450;

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, id, full_name } = req.body || {};

  if (!email) {
    return res.status(400).json({ error: "Missing required parameter: email" });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: "Supabase credentials not configured." });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Check how many emails were sent today (UTC start of day)
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const { count: sentTodayCount, error: countErr } = await supabase
      .from("registrations")
      .select("id", { count: "exact", head: true })
      .eq("email_sent", true)
      .gte("created_at", todayStart.toISOString());

    if (countErr) {
      console.warn("Could not calculate daily count:", countErr.message);
    }

    // 2. Check if daily quota threshold reached (450 emails)
    if (typeof sentTodayCount === "number" && sentTodayCount >= DAILY_INSTANT_LIMIT) {
      console.log(`Daily instant threshold (${sentTodayCount}/${DAILY_INSTANT_LIMIT}) reached. Leaving in queue.`);
      return res.status(200).json({ 
        status: "queued", 
        message: "Daily instant limit reached. Email queued for batch dispatch." 
      });
    }

    // 3. Configure Nodemailer Transporter
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

    const html = `
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;padding:24px;color:#0f172a;line-height:1.6;">
        <div style="max-width:560px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;padding:32px;background:#ffffff;">
          <h2 style="color:#f05138;margin-top:0;">Swift Student Challenge 2027</h2>
          <p style="font-size:16px;">Hi <strong>${first}</strong>,</p>
          <p>Your registration for the <strong>Swift Student Challenge 2027</strong> at Swift Coding Club, Parul University has been successfully recorded!</p>
          <p>Our mentor team is reviewing your app playground idea. We will reach out to you with upcoming workshop schedules and challenge guidance.</p>
          <div style="margin:24px 0;padding:16px;background:#f8fafc;border-left:4px solid #f05138;border-radius:4px;">
            <p style="margin:0;font-size:14px;color:#475569;"><strong>Status:</strong> Registration Verified & Received</p>
          </div>
          <hr style="border:0;border-top:1px solid #e2e8f0;margin:24px 0;"/>
          <p style="margin:16px 0 12px;font-size:14px;color:#0f172a;font-weight:600;">Stay Connected For Updates:</p>
          <div style="margin-bottom:16px;">
            <a href="https://chat.whatsapp.com/FXLcmWvxJbP24jZIn4B3Il" style="display:inline-block;padding:8px 16px;margin:0 8px 8px 0;background:#25D366;color:#ffffff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;">WhatsApp Community</a>
            <a href="https://whatsapp.com/channel/0029VbDO8OGD8SE0NtyZbN3h" style="display:inline-block;padding:8px 16px;margin:0 8px 8px 0;background:#25D366;color:#ffffff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;">WhatsApp Channel</a>
            <a href="https://www.instagram.com/swiftcodingclub_pu/" style="display:inline-block;padding:8px 16px;margin:0 8px 8px 0;background:#E1306C;color:#ffffff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;">Instagram</a>
            <a href="https://www.linkedin.com/company/scc-pu/" style="display:inline-block;padding:8px 16px;margin:0 0 8px 0;background:#0077b5;color:#ffffff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;">LinkedIn</a>
          </div>
          <p style="font-size:12px;color:#94a3b8;margin:0;">Ref ID: #${uniqueHash} · Swift Coding Club, Parul University</p>
        </div>
      </body>
    `;

    // Send Mail
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Swift Coding Club Parul University" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Registration Confirmed — Swift Student Challenge 2027",
      html: html,
    });

    // 4. Update Supabase record as email_sent = true
    if (id) {
      await supabase
        .from("registrations")
        .update({ email_sent: true })
        .eq("id", id);
    } else {
      await supabase
        .from("registrations")
        .update({ email_sent: true })
        .eq("email", email);
    }

    return res.status(200).json({ 
      status: "sent", 
      message: "Confirmation email sent instantly!" 
    });

  } catch (err) {
    console.error("Instant email error:", err);
    return res.status(200).json({ 
      status: "queued", 
      message: "Email queued due to SMTP delay." 
    });
  }
};
