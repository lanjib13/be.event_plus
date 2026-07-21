const QRCode = require("qrcode");

const generateQRCode = async (text) => {
  return await QRCode.toDataURL(text);
};

module.exports = generateQRCode;