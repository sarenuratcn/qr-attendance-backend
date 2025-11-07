const QRCode = require('qrcode');

async function genDataUrl(text){
  return QRCode.toDataURL(text);
}

module.exports = { genDataUrl };
