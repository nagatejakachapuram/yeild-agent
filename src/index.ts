import { main } from "./agent";

async function start() {
  console.log("🔁 Running yield strategy selection...");

  await main("low");
  await main("high");

  console.log("✅ Strategy selection complete.");
}

start().catch((err) => {
  console.error("❌ Error in strategy agent:", err);
});
