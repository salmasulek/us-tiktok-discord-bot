const fetch = require("node-fetch");
const fs = require("fs");

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK;
const CREATORS = ["Danaarose", "Eloisedufka", "Kylievolkers", "Thatgirlwiththecurlyhair", "Bellarmrz"];
const FILE = "posts.json";

let seen = {};

try {
  seen = JSON.parse(fs.readFileSync(FILE));
} catch (e) {
  seen = {};
}

async function run() {
  for (const user of CREATORS) {
    const rssUrl = `https://www.tiktok.com/@${user}/rss`;
    try {
      const res = await fetch(rssUrl);
      const text = await res.text();
      const matches = [...text.matchAll(new RegExp(`https://www\\.tiktok\\.com/@${user}/video/(\\d+)`, "g"))];

      console.log(matches.length)
      
      if (!seen[user]) seen[user] = [];

      if (matches.length === 0) continue;

      // Send the **latest video** if first run for this user
      if (seen[user].length === 0) {
        const latestId = matches[0][1];
        await sendWebhook(user, latestId);
        seen[user].push(latestId);
      }

      // Then handle all new videos normally
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


async function sendWebhook(user, videoId) {
  const url = `https://www.tiktok.com/@${user}/video/${videoId}`;
  await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: `📣 **${user} posted a new TikTok!**\n${url}` }),
  });
}

run();
