/**
 * SSC 2027 — Transactional Email Sender with AI Spam/Bot Bypass
 * 
 * This script runs locally or as a scheduled background worker.
 * It bypasses standard AI-based bulk spam filters by:
 * 1. Randomizing delays between individual sends (4 - 11 seconds).
 * 2. Creating randomized batches (e.g., pause 30-75 seconds after sending 6-12 emails).
 * 3. Randomizing email headers and HTML content (dynamic greetings, unique tracking hashes).
 */

const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
require("dotenv").config(); // Load variables from .env

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error("Error: SUPABASE_URL and SUPABASE_ANON_KEY/SERVICE_ROLE_KEY must be set in env.");
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: parseInt(process.env.SMTP_PORT || "465") === 465,
  auth: {
    user: process.env.SMTP_USER, // your aatcepu@gmail.com account
    pass: process.env.SMTP_PASS, // 16-character app password
  },
});

// Helper for human-like pauses
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Random choice helper
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Generate an email body with unique fingerprints to defeat LLM/Spam detectors
function generateAntiSpamHtml(name, refId) {
  const first = name && name.trim() ? name.trim().split(" ")[0] : "there";
  
  // 1. Randomize Greetings (Bypasses keyword matching)
  const greetings = [
    `Hi ${first},`,
    `Hello ${first},`,
    `Dear ${first},`,
    `Greetings ${first},`,
    `Hi there ${first},`
  ];
  const chosenGreeting = pickRandom(greetings);

  // 2. Randomize closing phrases
  const closings = [
    `You'll hear back from us soon with the next steps — no action is needed from your side right now.`,
    `Our team is currently reviewing all submissions. We'll update you with next steps shortly.`,
    `Your application is now under review. We will contact you soon regarding the next stage.`,
  ];
  const chosenClosing = pickRandom(closings);

  // 3. Generate a unique hash signature for the email footer
  const uniqueHash = crypto.createHash("md5").update(refId + Date.now().toString()).digest("hex").slice(0, 10).toUpperCase();

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:32px;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e6e8ec;border-radius:10px;padding:40px 36px;">
    <p style="margin:0 0 22px;color:#F05138;font-weight:700;letter-spacing:.6px;font-size:12px;text-transform:uppercase;">Swift Student Challenge 2027 · Parul University</p>
    <h1 style="margin:0 0 14px;color:#111418;font-size:22px;line-height:1.3;font-weight:700;">Your response has been recorded</h1>
    <p style="margin:0 0 16px;color:#3f4651;font-size:15px;line-height:1.65;">
      ${chosenGreeting} thank you for registering for the Swift Student Challenge 2027 at Parul University. Your response has been recorded and our team at <strong style="color:#111418;">Swift Coding Club, Parul University</strong> is now reviewing it.
    </p>
    <p style="margin:0 0 16px;color:#3f4651;font-size:15px;line-height:1.65;">
      ${chosenClosing}
    </p>
    <p style="margin:0;color:#3f4651;font-size:15px;line-height:1.65;">
      If you have any questions, reply directly to this mail or reach out at <a href="mailto:aatcepu@gmail.com" style="color:#F05138;text-decoration:none;">aatcepu@gmail.com</a>.
    </p>
    <div style="margin-top:28px;padding-top:18px;border-top:1px solid #eceef1;color:#9aa1ab;font-size:11px;display:flex;justify-content:between;">
      <span>Swift Coding Club · Parul University</span>
      <span style="color:#e2e8f0;margin-left:auto;">REF: #${uniqueHash}</span>
    </div>
  </div>
  <!-- Anti-fingerprint padding to ensure file hash changes uniquely for every recipient -->
  <!-- ${crypto.randomBytes(16).toString("hex")} -->
</body>
</html>`;
}

async function runQueue() {
  console.log("Checking Supabase for unsent confirmation emails...");
  
  // Fetch a batch of unsent registrations
  const { data: students, error } = await supabase
    .from("registrations")
    .select("id, email, full_name, created_at")
    .eq("email_sent", false)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) {
    console.error("Error fetching registrations:", error);
    return;
  }

  if (!students || students.length === 0) {
    console.log("All emails are sent. Queue is empty!");
    return;
  }

  console.log(`Found ${students.length} unsent emails. Starting queue...`);

  let processedCount = 0;

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const email = student.email;
    const name = student.full_name;

    try {
      console.log(`\n[${i + 1}/${students.length}] Preparing email for ${name} (${email})...`);

      const html = generateAntiSpamHtml(name, student.id);

      // Send the email
      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"Swift Coding Club Parul University" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Application Recorded — Swift Coding Club Parul University · Swift Student Challenge 2027",
        html: html,
      });

      // Update Supabase immediately to mark as sent
      const { error: updateError } = await supabase
        .from("registrations")
        .update({ email_sent: true })
        .eq("id", student.id);

      if (updateError) {
        console.error(`DB Update Error for ${email}:`, updateError);
      } else {
        console.log(`✓ Email sent and marked sent in Supabase.`);
      }

      processedCount++;

      // 1. RANDOM DELAY between individual emails (4 to 11 seconds)
      // This breaks standard "robotic" rhythmic timelines.
      const delayTime = Math.floor(Math.random() * 7000) + 4000;
      console.log(`Waiting for ${Math.round(delayTime / 1000)} seconds before next send...`);
      await wait(delayTime);

      // 2. RANDOM BATCH PAUSE (Resting Period)
      // Every 6 to 12 emails, pause for a longer duration (35 to 75 seconds)
      // This simulates a human taking a break or verifying lists.
      if (processedCount % (Math.floor(Math.random() * 7) + 6) === 0 && i < students.length - 1) {
        const restTime = Math.floor(Math.random() * 40000) + 35000;
        console.log(`\n--- [Human Simulation] Taking a rest break for ${Math.round(restTime / 1000)} seconds... ---`);
        await wait(restTime);
      }

    } catch (sendError) {
      console.error(`✗ Failed to send email to ${email}:`, sendError);
      // Wait a bit longer if there's an error, then retry next candidate
      await wait(15000);
    }
  }

  console.log("\nQueue processing completed for this batch.");
}

// Run the script
runQueue();
