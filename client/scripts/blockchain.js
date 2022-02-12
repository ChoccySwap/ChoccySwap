const ft3 = require('ft3-lib');
const pcl = require('postchain-client')
const axios = require('axios')
const blockchainRID="07F1975AAD02E42F773F4926E2AD830CD4ECDCCE048C957C610A50EA5B4D1500";
const blockchainUrl="https://choccyswap.com:7743/";
const vaultUrl="https://dev.vault.chromia-development.com";
const chainId = Buffer.from(blockchainRID, 'hex');
const chromaID = "b44ea16389c581d6255f5b285df7b8a7acfc812ab6ea852e72ca973d5b3ae30c";
var blockchain, sso, account, user;

module.exports={connect: load};

const rawTx = new URLSearchParams(window.location.search.replaceAll("?", "&")).get("rawTx"); // extract rawTx query parameter

/********************************************************/

function logError(e, addedTxt = ""){
  console.log(e + " " + addedTxt);
  let errDiv = document.getElementById("errdiv").cloneNode(true);
  errDiv.children[0].innerHTML = e.toString()+( (addedTxt)? ": "+addedTxt : "");
  errDiv.hidden = false;
  document.querySelector("#root").insertBefore(errDiv, document.querySelector(".err"));
  setTimeout(()=>errDiv.classList.add("active"), 1);
  setTimeout(()=>{errDiv.classList.add("inactive"); setTimeout(()=>document.querySelector("#root").removeChild(errDiv), 1000);}, 6000);
}

function logTx(){
  let errDiv = document.getElementById("errdiv").cloneNode(true);
  errDiv.children[0].innerHTML = "Transaction succeded!";
  errDiv.hidden = false;
  document.querySelector("#root").insertBefore(errDiv, document.querySelector(".err"));
  errDiv.classList.add("success")
  setTimeout(()=>errDiv.classList.add("active"), 1);
  setTimeout(()=>{errDiv.classList.add("inactive"); setTimeout(()=>document.querySelector("#root").removeChild(errDiv), 1000);}, 6000);
  checkBalances();
}

async function load(){
  try{
    let html = document.querySelector("html");
    html.logged = false;
    let connectLink = document.getElementById("vault-link");
    document.getElementById("chainctl").classList.remove("disconnected");
    document.getElementById("chainctl").classList.remove("connected");
    document.getElementById("chainctl").classList.add("connecting");
    document.querySelector("#vault-link span").innerHTML="Connecting...";
    document.querySelector("#jelly").hidden = true;
    document.getElementById("liq-btn").addEventListener("click", connect);
    document.getElementById("add-liq").addEventListener("click", addLiqWrapper);
    document.getElementById("remove-liq").addEventListener("click", removeLiqWrapper);
    connectLink.removeEventListener("click", disconnect);
    connectLink.removeEventListener("click", connect);
    module.exports.checkBals= checkBalances;
    if(!rawTx){
      disconnected();
    }

    await connectBC();
  } catch (e) {
    document.querySelector("#jelly").hidden = true;
    document.querySelector("#vault-link span").innerHTML="Error connecting to Chromia Vault";
    logError(e)
  }
}

async function connectBC(){
  blockchain = await new ft3.Postchain(blockchainUrl).blockchain(chainId);
  module.exports.registerAsset = registerAsset;
  module.exports.getAssets = getAssets;
  module.exports.bc = blockchain
  module.exports.rawCoinBal = checkCoinBalance;
  ft3.SSO.vaultUrl = vaultUrl;
  sso = new ft3.SSO(blockchain);
  try {
    if (rawTx){
      [account, user] = await sso.finalizeLogin(rawTx);
      module.exports.session = blockchain.newSession(user);
      module.exports.ft3 = ft3;
      connected();
    }
  } catch (error) {
    logError(error);
  }
  document.querySelector("#swap-input input").addEventListener("input", (e)=>{swapsInOut(e.target.parentNode, false, "#swap-output")});
  document.querySelector("#swap-output input").addEventListener("input", (e)=>{swapsInOut(e.target.parentNode, true, "#swap-input")});
  document.querySelector("#liq-input input").addEventListener("input", (e)=>{poolsInOut(e.target.parentNode, false, "#liq-output")});
  document.querySelector("#liq-output input").addEventListener("input", (e)=>{poolsInOut(e.target.parentNode, true, "#liq-input")});
}

function connect() {
  const swapPage = `${window.location.href}`;
  sso.initiateLogin(swapPage, swapPage);//get back to the home either way
}

function connected(){
  html.logged=true;
  let connectLink = document.getElementById("vault-link");
  document.getElementById("chainctl").classList.add("connected");
  document.getElementById("chainctl").classList.remove("disconnected");
  document.getElementById("chainctl").classList.remove("connecting");
  document.querySelector("#vault-link span").innerHTML="Disconnect from Choccyswap";
  document.querySelector("#jelly").hidden = false;
  connectLink.removeEventListener("click", connect);
  connectLink.addEventListener("click", disconnect);
  let swapButton = document.getElementById("swap-btn");
  swapButton.children[0].innerHTML="Swap now!";
  swapButton.removeEventListener("click", connect);
  swapButton.addEventListener("click", swapWrapper);
  document.getElementById("liq-button").hidden = true;
  document.getElementById("add-liq").hidden = false;
  document.getElementById("remove-liq").hidden = false;
  document.getElementById("chainctl").setAttribute("data-tooltip", "Current account:\n" + account.id.toString("hex"));
  document.querySelectorAll(".input-wrapper > p").forEach((p) => {
    p.hidden = false;
  });
}

function disconnected(){
  html.logged=false;
  let connectLink = document.getElementById("vault-link");
  document.getElementById("chainctl").classList.add("disconnected");
  document.getElementById("chainctl").classList.remove("connected");
  document.getElementById("chainctl").classList.remove("connecting");
  document.querySelector("#vault-link span").innerHTML="Connect to Chromia Vault";
  document.querySelector("#jelly").hidden = true;
  connectLink.removeEventListener("click", disconnect);
  connectLink.addEventListener("click", connect);
  let swapButton = document.getElementById("swap-btn");
  swapButton.children[0].innerHTML="Connect to Chromia Vault";
  swapButton.removeEventListener("click", swapWrapper);
  swapButton.addEventListener("click", connect);
  document.getElementById("liq-button").hidden = false;
  document.getElementById("add-liq").hidden = true;
  document.getElementById("remove-liq").hidden = true;
  document.getElementById("chainctl").setAttribute("data-tooltip", "Current account: none");
  document.querySelectorAll(".input-wrapper > p").forEach((p) => {
    p.hidden = true;
  });
}

async function disconnect() {await sso.logout(); disconnected();}

function addLiqWrapper(){
  call(addLiq);
}
function removeLiqWrapper(){
  call(removeLiq);
}
function swapWrapper(){
  call(swap);
}
function call(fun){
  if (document.getElementById("skip").checked){
    fun()
  } else {
    document.getElementById("cnf-btn").f = fun;
    document.getElementById("alert-bg").classList.remove("hidden");
  }
}


async function swap(){
  try {
    let input = document.querySelector("#swap-input input");
    let buttInput = document.querySelector("#swap-input button");
    let output = document.querySelector("#swap-output input");
    let buttOutput = document.querySelector("#swap-output button");
    let slippage = document.getElementById("slippage-input");
    let deadline = document.getElementById("deadline-input");
    let tokIn = buttInput.token;
    let amountIn = Math.round(parseFloat(input.value)* Math.pow(10, tokIn.decimals));
    let tokOut = buttOutput.token;
    let amountOut = parseFloat(output.value)* Math.pow(10, tokOut.decimals);
    let amountMin = Math.round(amountOut * (1 - parseFloat(slippage.value || slippage.placeholder)/100));
    let dead = Date.now() + parseFloat(deadline.value || deadline.placeholder)*60000;
    await blockchain.transactionBuilder()
      .add(ft3.op('swap', Buffer.from(tokIn.id, 'hex'), Buffer.from(tokOut.id, 'hex'), amountIn, amountMin, dead, user.authDescriptor.id, account.id))
      .add(ft3.nop())
      .buildAndSign(user)
      .post();
    logTx();
  } catch (err) {
    logError(err);// TODO: find a way to add the reason of the error
  }
  checkBalances();
}

async function addLiq(){
  try {
    let first = document.querySelector("#liq-input input");
    let firstToken = document.querySelector("#liq-input button").token;
    let second = document.querySelector("#liq-output input");
    let secondToken = document.querySelector("#liq-output button").token;
    let amountFirst = Math.round(parseFloat(first.value)* Math.pow(10, firstToken.decimals));
    let amountSecond = Math.round(parseFloat(second.value)* Math.pow(10, secondToken.decimals));
    await blockchain.transactionBuilder()
      .add(ft3.op('add_liq', Buffer.from(firstToken.id, 'hex'), Buffer.from(secondToken.id, 'hex'), amountFirst, amountSecond, user.authDescriptor.id, account.id))
      .add(ft3.nop())
      .buildAndSign(user)
      .post();
    logTx();
  } catch (err) {
    logError(err);// TODO: find a way to add the reason of the error
  }
  checkBalances();
}

async function removeLiq(){
  try {
    let first = document.querySelector("#liq-input input");
    let firstToken = document.querySelector("#liq-input button").token;
    let second = document.querySelector("#liq-output input");
    let secondToken = document.querySelector("#liq-output button").token;
    let amountFirst = Math.round(parseFloat(first.value)* Math.pow(10, firstToken.decimals));
    let amountSecond = Math.round(parseFloat(second.value)* Math.pow(10, secondToken.decimals));
    await blockchain.transactionBuilder()
      .add(ft3.op('remove_liq', Buffer.from(firstToken.id, 'hex'), Buffer.from(secondToken.id, 'hex'), amountFirst, amountSecond, user.authDescriptor.id, account.id))
      .add(ft3.nop())
      .buildAndSign(user)
      .post();
    logTx();
  } catch (err) {
    logError(err);// TODO: find a way to add the reason of the error
  }
  checkBalances();
}

function checkCoinBalance(id){
  return ft3.AssetBalance.getByAccountAndAssetId(Buffer.from(account.id, 'hex'), id, blockchain);
}

async function checkBalances(){
  let first = html.picks[0];
  let second = html.picks[1];
  let inv = false;
  let isPair = first && second;

  let labels= ["",""]

  if(isPair){
    let info;
    try {
      info = await blockchain.query('get_pair', {a1: Buffer.from(first.id, 'hex'), a2: Buffer.from(second.id, 'hex')} );
    } catch (invertedOrNonExistent) {
      try{
        info = await blockchain.query('get_pair', {a1: Buffer.from(second.id, 'hex'), a2: Buffer.from(first.id, 'hex')} );
        inv = true;
      } catch (nonExistent) {
        isPair = false;
      }
    }
    if (isPair){
      info = JSON.parse(info);
      let am1 = inv? info.amount2 : info.amount1;
      let am2 = inv? info.amount1 : info.amount2;
      let balLP = account? await ft3.AssetBalance.getByAccountAndAssetId(Buffer.from(account.id, 'hex'), Buffer.from(info.lp_id, 'hex'), blockchain) : 0;
      let price = am1/am2;
      labels = [`Price: ${price} ${first.symbol}/${second.symbol} | ${1/price} ${second.symbol}/${first.symbol}`,
                    `Total liquidity: ${am1} ${first.symbol} - ${am2} ${second.symbol}`+
                    (account? `<br>Your liquidity: ${(balLP.amount/info.lp_supply)*am1} ${first.symbol} - ${(balLP.amount/info.lp_supply)*am2} ${second.symbol}` : "")];
    }
  }
  let bal1 = 0;
  let bal2 = 0;
  try{
    bal1 = account&&first?
      (await ft3.AssetBalance.getByAccountAndAssetId(Buffer.from(account.id, 'hex'), Buffer.from(first.id, 'hex'), blockchain)).amount/Math.pow(10, first.decimals)
      : null;
  } catch(BalanceDoesntExist) {bal1=0;}
  try{
    bal2 = account&&second?
      (await ft3.AssetBalance.getByAccountAndAssetId(Buffer.from(account.id, 'hex'), Buffer.from(second.id, 'hex'), blockchain)).amount/Math.pow(10, second.decimals)
      : null;
  } catch(BalanceDoesntExist) {bal2=0;}

  bals = [bal1, bal2];

  document.querySelectorAll(".input-wrapper > p").forEach((p, i) => {
    if (account){
      p.innerHTML = bals[i % 2]? bals[i % 2] + " " + html.picks[i % 2].symbol : "0 "+ html.picks[i % 2].symbol;
    } else {
      p.innerHTML = "";
    }
  });

  document.querySelectorAll(".label p").forEach((p, i) => {
    p.innerHTML = labels[i];
  });
}

async function getAssets(){
  var assets = await blockchain.getAllAssets();
  await Promise.all(assets.map(async(coin, i) => {
    if (coin.name.match(/^0x[a-fA-F0-9]{64}-0x[a-fA-F0-9]{64} LP$/)){
      assets.splice(assets.indexOf(coin), 1);
      return
    }
    await axios
      .get(window.location.origin + "/tokens/" + coin.id.toString("hex"))
      .then(res => {
        assets[i]["symbol"] = res.data.symbol;
        assets[i]["link"] = res.data.link;
        assets[i]["decimals"] = 0;
      })
      .catch(error => {
        console.error("Asset not found! Response: " + error.toString())
      })
  }))
  assets.sort((a, b)=>{
    if (a.id===chromaID) { return -1;}
    if (b.id===chromaID) { return 1;}
    if (a.name < b.name) { return -1;}
    if (a.name > b.name) { return 1;}
    return 0
  })
  return assets
}

function swapsInOut(changedByUser, changedInput, toChangeQuery){
  let inValue;
  try {
    inValue = Math.round(parseFloat(changedByUser.children[0].value)* Math.pow(10, changedByUser.children[1].token.decimals))
  }
  catch (InputInvalidOrTokenUnset){
    console.log("input invalid or token unset");
    console.log(InputInvalidOrTokenUnset);
    return
  }
  let toChange = document.querySelector(toChangeQuery);

  if(html.picks[0]&&html.picks[1]){
    let info
    try{
      info = document.querySelector("#liq-boxes .label p").innerHTML.match(/(?<=Total liquidity\: )[\d\.]+ \w+ - [\d\.]+ \w+/)[0];
    } catch(PoolDoesntExist) {
      console.log("Inexistent pool");
      console.log(PoolDoesntExist);
      return
    }
    if (info){
      let pools = info.split(" - ");
      pools[0] = parseFloat(pools[0]);
      pools[1] = parseFloat(pools[1]);
      let k = pools[0]*pools[1];
      let outValue = (   pools[Number(!changedInput)] - (k/(pools[Number(changedInput)]+inValue))   )*0.997 || 0;
      let label = document.querySelector("#swap .label p");
      let price = inValue/outValue;
      let labtxt = label.innerHTML
      let theoreticalPrice = parseFloat(labtxt.match(/(?<=Price\: )[\d\.]+/))
      let impact = 1 - (theoreticalPrice/price);
      if (labtxt.match("<br>") !== null) {
        labtxt = labtxt.replace(/<br>.*/, "");
      }
      label.innerHTML = labtxt+(impact?//if impact is Nan, don't add anything (fields are empty)
        `<br>${impact>0.33? "<span>" : ""}${impact>0.10? "<span>" : ""}You're losing ${impact<0.1? "only ":""}${(impact*100).toFixed(2)}% of the expected output`+
        ((impact>0.1)? ` due to low liquidity </span>${impact>0.33? "</span>" : ""}`: "") : "");
      toChange.children[0].value = outValue / Math.pow(10, toChange.children[1].token.decimals)
    }
  }
}


function poolsInOut(changedByUser, changedInput, toChangeQuery){
  let inValue;
  try {
    inValue = Math.round(parseFloat(changedByUser.children[0].value)* Math.pow(10, changedByUser.children[1].token.decimals))
  }
  catch (InputInvalidOrTokenUnset){
    console.log("input invalid or token unset");
    console.log(InputInvalidOrTokenUnset);
    return
  }
  let toChange = document.querySelector(toChangeQuery);

  if(html.picks[0]&&html.picks[1]){
    let info
    try{
      info = document.querySelector("#liq-boxes .label p").innerHTML.match(/(?<=Total liquidity\: )[\d\.]+ \w+ - [\d\.]+ \w+/)[0];
    } catch(PoolDoesntExist) {
      console.log("Inexistent pool");
      console.log(PoolDoesntExist);
      return
    }
    if (info){
      let pools = info.split(" - ");
      pools[0] = parseFloat(pools[0]);
      pools[1] = parseFloat(pools[1]);
      let ratio = pools[Number(!changedInput)]/pools[Number(changedInput)];
      let outValue = (inValue * ratio) || 0
      toChange.children[0].value = outValue / Math.pow(10, toChange.children[1].token.decimals)
    }
  }
}
