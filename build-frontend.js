const fs = require("fs");
const path = require("path");

function abiOf(name) {
  const raw = fs.readFileSync(path.join(__dirname, "build", `${name}.json`), "utf8");
  return JSON.parse(raw).abi;
}

const TICKET_ABI = abiOf("EventTicketNFT");
const MARKETPLACE_ABI = abiOf("TicketMarketplace");
const FACTORY_ABI = abiOf("TicketFactory");

const template = fs.readFileSync(path.join(__dirname, "frontend", "index.template.html"), "utf8");

const output = template
  .replace("__TICKET_ABI__", JSON.stringify(TICKET_ABI))
  .replace("__MARKETPLACE_ABI__", JSON.stringify(MARKETPLACE_ABI))
  .replace("__FACTORY_ABI__", JSON.stringify(FACTORY_ABI));

fs.mkdirSync(path.join(__dirname, "frontend"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "frontend", "index.html"), output);
console.log("wrote frontend/index.html");
