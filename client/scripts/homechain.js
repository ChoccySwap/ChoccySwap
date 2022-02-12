const ft3 = require('ft3-lib');
const pcl = require('postchain-client');
const blockchainRID="07F1975AAD02E42F773F4926E2AD830CD4ECDCCE048C957C610A50EA5B4D1500";
const blockchainUrl="https://choccyswap.com:7743/";
const chainId = Buffer.from(blockchainRID, 'hex');
const valueID = "b44ea16389c581d6255f5b285df7b8a7acfc812ab6ea852e72ca973d5b3ae30c";
var blockchain, loadedNumbers = false, alreadyAnimated = false, numSels = [], values = [];

module.exports={connect: load};

/********************************************************/
async function load(){
  blockchain = await new ft3.Postchain(blockchainUrl).blockchain(chainId);
  window.onscroll = scrollNumbers;

  numSels.push('#assets p');
  numSels.push('#users p');
  numSels.push('#trades p');
  numSels.push('#pairs p');
  numSels.push('#value p');

  values.push(0);
  let assets = await blockchain.getAllAssets();
  assets.forEach((coin, i) => {
    if (!coin.name.match(/^0x[a-fA-F0-9]{64}-0x[a-fA-F0-9]{64} LP$/)){
      values[0]++;
    }
  });

  values.push(await blockchain.query('get_user_number', {}));
  values.push(await blockchain.query('get_tx_number', {}));
  values.push(await blockchain.query('get_pair_number', {}));
  values.push(await blockchain.query('get_circulating_value_in', {asset_ID: Buffer.from(valueID, "hex")}));

  loadedNumbers = true;
  scrollNumbers();
}

function scrollNumbers(){
  if(checkVisible(document.querySelector(numSels[0])) && loadedNumbers && !alreadyAnimated) {
    console.log(values);
    for (let i = 0; i < numSels.length; i++){
      document.querySelector("html").loadNumber(numSels[i], parseInt(values[i]));
    }
    alreadyAnimated = true;
  }
}

function checkVisible(el) {
  var rect = el.getBoundingClientRect();
  var viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
  return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
}
