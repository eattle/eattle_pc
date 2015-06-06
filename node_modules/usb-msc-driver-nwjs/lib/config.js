module.exports = function () {
  var signature = 'a37580c5442844713ea11de5b2ee5029699d22777d63618c06ec5272a6515727';
  this.eattleSignature = new Buffer(signature, 'hex');
  return this;
};