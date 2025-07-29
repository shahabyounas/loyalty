const fs = require("fs");
const path = require("path");

// Read the built index.html
const indexPath = path.join(__dirname, "apps/dv/dist/index.html");
let html = fs.readFileSync(indexPath, "utf8");

// Replace absolute paths with relative paths for GitHub Pages
html = html.replace(/src="\//g, 'src="./');
html = html.replace(/href="\//g, 'href="./');

// Write the modified HTML back
fs.writeFileSync(indexPath, html);

console.log("✅ Fixed asset paths for GitHub Pages compatibility");
