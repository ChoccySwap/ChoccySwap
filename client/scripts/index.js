var coins, index;
var pickedCoins = [null, null];
var html;

async function load() {
  html = document.querySelector("html");
  html.mobile=false;
  document.getElementById("settings-button").addEventListener("click", (event)=>{SettingsDropDown(event,false);})
  document.querySelector("#coin-search input").addEventListener("input", search);
  if (navigator.userAgent.match(/iPhone|iPad|iPod|Android/i)) {
    html.mobile = true;
    let menu = document.getElementById("mobilemenu");
    let hamburger = document.getElementById("hamburger")
    let settings = document.getElementById("settings-menu");
    let chainctl = document.getElementById("chainctl");
    document.getElementById("liq-buttons").classList.remove("inline-sons");
    chainctl.parentNode.removeChild(chainctl);
    let b = document.querySelector("body");
    b.insertBefore(chainctl, b.children[b.children.length-1]);
    settings.classList.add("mobile");
    html.addEventListener("click", (event)=>{SettingsDropDown(event,true);})
    settings.addEventListener("click", (event)=>{event.stopPropagation();})
    document.querySelectorAll(".mobilemove").forEach((item, i) => {
      item.parentNode.removeChild(item);
      menu.children[0].appendChild(item);
    });
    menu.children[0].children[0].hidden = true;
  }
  else {
    let menu = document.getElementById("mobilemenu");
    Array.from(hamburger.children).forEach((item, i) => {
      hamburger.removeChild(item);
    });
    menu.hidden = true;
  }
  document.querySelectorAll(".inputs").forEach((inputBox, i) => {
      inputBox.addEventListener("click", (event) => { try{event.target.children[0].focus(); event.stopPropagation();}catch{}})
  });
  await BlockChain.connect();
  getCoins().then((c)=>{
    coins = c;
    let search = window.location.search.replaceAll("?", "&");
    let assetInID = new URLSearchParams(search).get("assetIn");
    let assetOutID = new URLSearchParams(search).get("assetOut");// window.location.search.match(/(?<=assetOut=)[A-Fa-f0-9]+/);
    if (assetInID){
      coins.find(coin => {
        if (coin.id.toString("hex").toLowerCase() === assetInID.toString().toLowerCase()){
          pickedCoins[0] = coin;
          return true;
        }
        return false;
      });
    } else{
      pickedCoins[0]=coins[0];
    }
    if (assetOutID){
      coins.find(coin => {
        if (coin.id.toString("hex").toLowerCase() === assetOutID.toString().toLowerCase()){
          pickedCoins[1] = coin;
          return true;
        }
        return false;
      });
    }
    html.picks = pickedCoins;
    UpdateButtons();
  });
}

async function getCoins() {
  let c = await BlockChain.getAssets();
  return c//assets in alphabetical order with Chr on top
}

function UpdateButtons() {
  imgsButt = document.querySelectorAll(".token")
  for (let i = 0; i<imgsButt.length; i++) {
    imgsButt[i].innerHTML = "";
    imgsButt[i].token=pickedCoins[i%2];
    if (pickedCoins[i%2] == null){
      imgsButt[i].classList.add("empty");
      imgsButt[i].innerHTML = "Pick a token";
    } else {
      imgsButt[i].classList.remove("empty");
      let image = document.createElement("img");
      image.src = pickedCoins[i%2].link;
      image.alt = pickedCoins[i%2].symbol;
      image.crossorigin = "anonymous";
      imgsButt[i].appendChild(image);
      insertUrlParam(i%2? "assetOut" : "assetIn", pickedCoins[i%2].id.toString("hex"))
      html.picks = pickedCoins;
    }
  }
  BlockChain.checkBals();
}

function ClosePicker() {
  UpdateButtons();
  document.getElementById("coin-pick-bg").classList.add("hidden");
  document.getElementById("scrollbox").innerHTML = "";
}

function abc(event){ event.stopPropagation();}

async function PickCoin(ind){
  let coinsBox = document.getElementById("scrollbox");
  coinsBox.innerHTML = "";
  index = ind;
  document.querySelector("#coin-search input").value="";
  let waiter = document.getElementById("wait-coins").cloneNode(true);
  coinsBox.appendChild(waiter);
  waiter.hidden = false;
  dialog = document.getElementById("coin-pick-bg");
  //dialog.setAttribute("targetbutton", index);
  dialog.classList.remove("hidden");
  getCoins().then((c)=>{
    coins=c;
    populateSearchbox(coins);
  });
}

function SwitchInOut(){
  let x = pickedCoins[1];
  pickedCoins[1] = pickedCoins[0];
  pickedCoins[0] = x;
  html.picks = pickedCoins;
  UpdateButtons();
  if (html.mobile) {
    document.querySelector("#swap-input input").select();
    document.querySelector("#swap-switch button").classList.add("animated");
    setTimeout( ()=>{document.querySelector("#swap-switch button").classList.remove("animated");} ,1000);
  }
}

function insertUrlParam(key, value) {
  if (history.replaceState) {
      let searchParams = new URLSearchParams(window.location.search);
      searchParams.set(key, value);
      let newurl = window.location.origin + window.location.pathname + '?' + searchParams.toString();
      window.history.pushState({path: newurl}, '', newurl);
  }
}

function populateSearchbox(coinList){
  document.getElementById("scrollbox").innerHTML = "";
  let coinsBox = document.getElementById("scrollbox");
  coinList.forEach(async (coin, i, coins)=>{
    newCoin = document.getElementById("coin-prototype").cloneNode(true);
    newCoin.addEventListener("click", ()=>{
                                            pickedCoins[index] = coin;
                                            ClosePicker();
                                          });
    newCoin.id = "c"+coin.id.toString("hex");
    coinsBox.appendChild(newCoin);
    newCoin.hidden=false;
    document.querySelector("#c"+coin.id.toString("hex")+" .symbol").innerHTML = coin.symbol;
    document.querySelector("#c"+coin.id.toString("hex")+" img").src = coin.link;
    document.querySelector("#c"+coin.id.toString("hex")+" p:not(.symbol)").innerHTML = coin.name;
    document.querySelector("#c"+coin.id.toString("hex")+" .id").innerHTML = coin.id.toString("hex");
    if (html.logged) {
      let bal = document.querySelector("#c"+coin.id.toString("hex")+" .amount");
      bal.classList.remove("hidden");
      let b = await BlockChain.rawCoinBal(coin.id);
      console.log(b);
      bal.removeChild(bal.children[1]);
      bal.children[0].innerHTML = b.amount/Math.pow(10, coin.decimals);
      bal.children[0].hidden = false;
    }
  });
}

function search(){
  let txt = document.querySelector("#coin-search input").value.toLowerCase();
  let coinList = [];
  coins.forEach((coin)=>{
    if(coin.name.toLowerCase().includes(txt) || coin.symbol.toLowerCase().includes(txt) || coin.id.toString("hex").toLowerCase().includes(txt)) {
      coinList.push(coin);
    }
  });
  populateSearchbox(coinList);
}
