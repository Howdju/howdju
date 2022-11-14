const { esbuilder } = require("./esbuilder");
const { ArgumentParser } = require("argparse");

const argParser = new ArgumentParser({
  description: "Run ESBuild with plugins etc.",
});
argParser.add_argument("--entryPoint", {
  dest: "entryPoints",
  nargs: "+",
  default: ["src/index.js"],
});
argParser.add_argument("--outfile", { default: "dist/index.js" });
argParser.add_argument("--watch", { action: "store_true" });
const args = argParser.parse_args();

esbuilder({
  entryPoints: args.entryPoints,
  outfile: args.outfile,
  watch: args.watch,
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
