const fetch = require("node-fetch");
const fs = require("fs");

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK;

const CREATORS = [
  "Danaarose",
  "Eloisedufka",
  "Kylievolkers",
  "Thatgirlwiththecurlyhair",
  "Bellarmrz"
];

const FILE = "posts.json";

let seen = {};
try {
  seen = JSON.parse(fs.readFileSync(FILE));
} catch (e) {
  seen = {};
}

async function sendWebhook(user, videoId) {
  const url = `https://www.tiktok.com/@${user}/video/${videoId}`;
  console.log(`Sending webhook: ${url}`); // Debugging
  await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: `📣 **${user} posted a new TikTok!**\n${url}` })
  });
}

async function run() {
  for (const user of CREATORS) {
    const profileUrl = `https://www.tiktok.com/@${user}`;

    console.log(`Scraping profile for: ${user}`); // Debugging

    try {
      const res = await fetch(profileUrl);
      const text = await res.text();

      // Find all video IDs from the profile page
      const matches = [...text.matchAll(new RegExp(`"videoId":"(\\d+)"`, "g"))];

      if (!seen[user]) seen[user] = [];

      console.log(`Found ${matches.length} videos for ${user}`); // Debugging

      if (matches.length === 0) {
        console.log(`No videos found for ${user} (profile might be private or empty)`); // Debugging
        continue;
      }

      if (seen[user].length === 0) {
        const latestId = matches[0][1];
        console.log(`First time post for ${user}, sending: ${latestId}`); // Debugging
        await sendWebhook(user, latestId);
        seen[user].push(latestId);
      }

      for (const match of matches) {
        const id = match[1];
        if (!seen[user].includes(id)) {
          console.log(`New video for ${user}: ${id}`); // Debugging
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

run();
