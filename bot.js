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

      // Find all video IDs from the TikTok profile page using a more robust regex
      const matches = [...text.matchAll(/"videoId":"(\d+)"/g)];

      if (!seen[user]) seen[user] = [];

      console.log(`Found ${matches.length} videos for ${user}`); // Debugging

      if (matches.length === 0) {
        console.log(`No videos found for ${user} (profile might be private or empty)`); // Debugging
        continue;
      }

      // If this is the first time the bot has run for this creator, pick the most recent (last) video
      if (seen[user].length === 0) {
        const latestId = matches[matches.length - 1][1]; // Get the last uploaded video
        console.log(`First time post for ${user}, sending: ${latestId}`); // Debugging
        await sendWebhook(user, latestId);
        seen[user].push(latestId);
      } else {
        // Check for new videos since the last video posted
        const latestId = matches[matches.length - 1][1]; // Get the most recent video
        const lastPostedId = seen[user][0]; // ID of the last posted video

        // If the latest video is different from the last posted video, send it
        if (latestId !== lastPostedId) {
          console.log(`New video for ${user}: ${latestId}`); // Debugging
          await sendWebhook(user, latestId);
          seen[user] = [latestId]; // Update with the latest video ID
        } else {
          console.log(`No new videos for ${user}. Latest ID: ${latestId}, Last posted: ${lastPostedId}`); // Debugging
        }
      }

    } catch (err) {
      console.error(`Error fetching ${user}:`, err);
    }
  }

  // Save the list of seen video IDs to avoid sending duplicates
  fs.writeFileSync(FILE, JSON.stringify(seen, null, 2));
}

// Run the bot
run();
