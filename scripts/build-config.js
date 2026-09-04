/* Runs at Vercel build time. Writes the client-side Supabase config
   from environment variables so no secret/key is ever committed. */
const fs = require("fs");

const url = process.env.SUPABASE_URL || "";
const key = process.env.SUPABASE_ANON_KEY || "";

fs.writeFileSync(
  "src/js/config.js",
  "/* generated at build time from Vercel env vars — do not edit */\n" +
    "window.SUPABASE_URL = " + JSON.stringify(url) + ";\n" +
    "window.SUPABASE_ANON_KEY = " + JSON.stringify(key) + ";\n"
);

console.log("config.js generated (supabase url set: " + (url ? "yes" : "no") + ")");
