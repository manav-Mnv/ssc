const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

  const { email } = req.body || {};

  if (!email) {
    return res.status(400).json({ error: "Missing email" });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: "Supabase credentials not configured." });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from("registrations")
      .select("id")
      .ilike("email", email.trim())
      .limit(1);

    if (error) {
      console.warn("Check email error:", error.message);
      return res.status(200).json({ exists: false });
    }

    return res.status(200).json({ exists: data && data.length > 0 });
  } catch (err) {
    console.error("Check email error:", err);
    return res.status(200).json({ exists: false });
  }
};
