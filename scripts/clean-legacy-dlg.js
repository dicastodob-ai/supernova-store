const fs = require('fs');
const path = require('path');

function cleanFile(relPath) {
  const filePath = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  content = content.replace(
    /https?:\/\/[^\s"'<>]*(?:anrdoezrs|dpbolvw|tkqlhce|jdoqocy|kqzyfj|qksrv|emjcd)\.(?:net|com)\/links\/7999396\/type\/dlg\/[^\/"'<>]+\/(https?:\/\/[^\s"'<>]+)/gi,
    '$1'
  );
  content = content.replace(
    /https:\/\/www\.anrdoezrs\.net\/links\/7999396\/type\/dlg\/sid\/supernova\/(https?:\/\/[^\s"'<>]+)/gi,
    '$1'
  );
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Cleaned legacy dlg prefix from:', relPath);
  }
}

cleanFile('data/master_catalog.json');
cleanFile('data/raw_products.json');
cleanFile('productos_wordpress.csv');
