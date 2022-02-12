function SettingsDropDown(event, onlyClose){
  var settings = document.getElementById("settings-menu");
  if (settings.classList.contains("hidden") && !onlyClose){
    settings.classList.remove("hidden");
  }else{
    settings.classList.add("hidden");
    //setTimeout(() => {settings.style.hidden=true;}, 401);
  }
  try{event.stopPropagation();}catch{}
}

function ShowSwapDialog(){
    var body = document.getElementById("body");
    body.classList.remove("pool");
    if (document.querySelector("html").mobile) {
      document.getElementById("swap-nav-link").hidden=true;
      document.getElementById("pool-nav-link").hidden=false;
      closeMenu();
    }
}
function ShowLiqDialog(){
    var body = document.getElementById("body");
    body.classList.add("pool");
    SettingsDropDown(null, true);
    if (document.querySelector("html").mobile) {
      document.getElementById("swap-nav-link").hidden=false;
      document.getElementById("pool-nav-link").hidden=true;
      closeMenu();
    }
}

function openMenu() {
  let menu = document.getElementById("mobilemenu");
  let hamb = document.getElementById("hamburger");
  menu.classList.add("open");
  hamb.classList.add("open");
  //menu.style.transform="translate(0%)";
  hamb.removeEventListener("click", openMenu);
  hamb.addEventListener("click", closeMenu);
}

function closeMenu() {
  let menu = document.getElementById("mobilemenu");
  let hamb = document.getElementById("hamburger");
  //menu.style.transform="translate(150%)";
  menu.classList.remove("open");
  hamb.classList.remove("open");
  //setTimeout(()=>{menu.classList.add("hidden");},1000);
  hamb.removeEventListener("click", closeMenu);
  hamb.addEventListener("click", openMenu);
}

function closeAlert() {
  document.getElementById("alert-bg").classList.add("hidden");
}

function confirmTx(){
  document.getElementById("cnf-btn").f();
  closeAlert();
}
