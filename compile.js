// Compiles contracts/*.sol using the npm-installed `solc` package instead of
// Hardhat's built-in downloader (which needs binaries.soliditylang.org).
// Writes plain {abi, bytecode} JSON artifacts to build/ for use in tests and
// deploy scripts via plain ethers.ContractFactory.
const fs = require("fs");
const path = require("path");
const solc = require("solc");

const CONTRACTS_DIR = path.join(__dirname, "contracts");
const BUILD_DIR = path.join(__dirname, "build");

function findImport(importPath) {
  const candidates = [
    path.join(CONTRACTS_DIR, importPath),
    path.join(__dirname, "node_modules", importPath),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return { contents: fs.readFileSync(candidate, "utf8") };
    }
  }
  return { error: `File not found: ${importPath}` };
}

function main() {
  const sources = {};
  for (const file of fs.readdirSync(CONTRACTS_DIR)) {
    if (!file.endsWith(".sol")) continue;
    sources[file] = { content: fs.readFileSync(path.join(CONTRACTS_DIR, file), "utf8") };
  }

  const input = {
    language: "Solidity",
    sources,
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "cancun",
      outputSelection: {
        "*": { "*": ["abi", "evm.bytecode.object"] },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImport }));

  let hasError = false;
  for (const err of output.errors || []) {
    if (err.severity === "error") {
      hasError = true;
      console.error(err.formattedMessage);
    } else {
      console.warn(err.formattedMessage);
    }
  }
  if (hasError) process.exit(1);

  fs.mkdirSync(BUILD_DIR, { recursive: true });

  for (const file of Object.keys(output.contracts)) {
    for (const contractName of Object.keys(output.contracts[file])) {
      const contract = output.contracts[file][contractName];
      const artifact = {
        contractName,
        abi: contract.abi,
        bytecode: "0x" + contract.evm.bytecode.object,
      };
      fs.writeFileSync(
        path.join(BUILD_DIR, `${contractName}.json`),
        JSON.stringify(artifact, null, 2)
      );
      console.log(`compiled ${contractName}`);
    }
  }
}

main();
