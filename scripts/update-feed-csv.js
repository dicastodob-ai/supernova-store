const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'feed-143k.csv');
if (fs.existsSync(filePath)) {
  console.log('[FEED] Updating feed-143k.csv...');
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.split('/affiliate/impact/').join('/affiliate/cj/');
  content = content.split('"impact"').join('"cj"');
  content = content.split(',impact,').join(',cj,');
  fs.writeFileSync(filePath, content);
  console.log('[FEED] feed-143k.csv updated cleanly to cj network!');
}
