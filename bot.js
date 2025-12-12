const fetch = require("node-fetch");
const fs = require("fs");

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK;

// List of TikTok creators
const CREATORS = [
  "Danaarose",
  "Eloisedufka",
  "Kylievolkers",
  "Thatgirlwiththecurlyhair",
  "Bellarmrz"
];

const FILE = "posts.json";

// Read previously sent posts
let seen = {};
try {
  seen = JSON.parse(fs.readFileSync(FILE));
} catch (e) {
  seen = {};
}

async function sendWebhook(user, videoId) {
  const url = `https://www.tiktok.com/@${user}/video/${videoId}`;
  await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: `📣 **${user} posted a new TikTok!**\n${url}` })
  });
}

async function run() {
  for (const user of CREATORS) {
    const rssUrl = `https://www.tiktok.com/@${user}/rss`;

    try {
      const res = await fetch(rssUrl);
      const text = await res.text();

      // Match all video URLs
      const matches = [...text.matchAll(new RegExp(`https://www\\.tiktok\\.com/@${user}/video/(\\d+)`, "g"))];

      if (!seen[user]) seen[user] = [];

      if (matches.length === 0) {
        console.log(`No videos found for ${user} (RSS might be blocked)`);
        continue;
      }

      // First run: send latest TikTok
      if (seen[user].length === 0) {
        const latestId = matches[0][1];
        await sendWebhook(user, latestId);
        seen[user].push(latestId);
      }

      // Send any new TikToks
      for (const match of matches) {
        const id = match[1];
        if (!seen[user].includes(id)) {
          await sendWebhook(user, id);
          seen[user].push(id);
        }
      }

    } catch (err) {
      console.error(`Error fetching ${user}:`, err);
    }
  }

  fs.writeFileSync(FILE, JSON.stringify(seen, null, 2));
}

// Run the bot
run();
