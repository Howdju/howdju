esbuild src/index.ts --bundle --outfile=dist/tmp/global-fragment-generation.js --platform=browser --target=es2016
cmp --silent dist/global-fragment-generation.js dist/tmp/global-fragment-generation.js || {
  echo "global-fragment-generation.js is not up to date. Please run \`yarn build:global-fragment-generation-script\` and commit the changes."
  exit 1
}
