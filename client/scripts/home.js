
var menuIndex = 1;
var isMobile = false;
var leftInterval, rightInterval;

function load() {
  document.querySelector("html").loadNumber = animateValue;
  if (navigator.userAgent.match(/iPhone|iPad|iPod|Android/i)) {
    let launch = document.getElementById("launch");
    launch.parentNode.removeChild(launch);
    document.getElementById("top").appendChild(launch);
    let hamnav = document.getElementById('ham-nav');
    document.querySelector("body").insertBefore(hamnav, document.getElementById("top"));
    hamnav.hidden = false;
    document.querySelectorAll(".mobilemove").forEach((item, i) => {
      item.parentNode.removeChild(item);
      document.getElementById('ham-items').appendChild(item);
    });
    document.getElementById("scroll-left").classList.add("inactive");
    document.getElementById("scroll-left").addEventListener("click", ()=>{
      document.getElementById("scroll-right").classList.remove("inactive");
      menuIndex = (menuIndex===1)? 1 : menuIndex -1;
      if (menuIndex === 1){document.getElementById("scroll-left").classList.add("inactive");}
      scroll();
    });
    document.getElementById("scroll-right").addEventListener("click", ()=>{
      document.getElementById("scroll-left").classList.remove("inactive");
      menuIndex = (menuIndex===5)? 5 : menuIndex +1;
      if (menuIndex === 5){document.getElementById("scroll-right").classList.add("inactive");}
      scroll();
    });
    document.querySelector("body").addEventListener("click", closeMenu);
    document.getElementById("ham-nav").addEventListener("click", preventClosing);
    closeMenu()
    isMobile = true;
  } else {
    document.getElementById("scroll-left").addEventListener("mouseenter", scrollLeft);
    document.getElementById("scroll-right").addEventListener("mouseenter", scrollRight);
    document.getElementById("scroll-left").addEventListener("mouseleave", () => {
      if(leftInterval){
        clearInterval(leftInterval);
        leftInterval = null;
      }
    });
    document.getElementById("scroll-right").addEventListener("mouseleave", () => {
      if(rightInterval){
        clearInterval(rightInterval);
        rightInterval = null;
      }
    });
  }
  window.addEventListener("resize", scroll);
  scroll();

  BlockChain.connect();
}

function scroll(){
  let scrmenu = document.getElementById("menu-scroll");
  let span = calcBoxSize();
  let firstScroll = span - ((scrmenu.clientWidth - (isMobile? 1:2)*span)/2);
  let movable = document.getElementById("movable");
  movable.style.transform = `translateX(${-firstScroll - (menuIndex-1)*span}px)`
  if (isMobile){
    Array.from(movable.children).forEach((menu, i)=>{
      if (menuIndex == i){show(menu, true);}
      else {show(menu, false);}
    });
  } else{
    Array.from(movable.children).forEach((menu, i)=>{
      if ([menuIndex, menuIndex + 1].includes(i)){show(menu, true);}
      else {show(menu, false);}
    });
  }
}

function calcBoxSize(){
  let box = document.getElementById("movable").children[0];
  let style = getComputedStyle(box);
  return parseInt(style.marginLeft)*2 + box.offsetWidth;
}

function show(el, b){
  var fs = [x=>el.classList.add(x), x=>el.classList.remove(x)];
  fs[0](b? "show" : "mini");
  fs[1](b? "mini" : "show");
}

function scrollLeft(){
  leftInterval = setInterval(()=>{
    if(menuIndex>1){
      menuIndex--;
      document.getElementById("scroll-right").classList.remove("inactive")
      if (menuIndex === 1) {
        document.getElementById("scroll-left").classList.add("inactive");
      }
      scroll();
    }
  }, 1000);
}

function scrollRight(){
  rightInterval = setInterval(()=>{
    if(menuIndex<4){
      menuIndex++;
      document.getElementById("scroll-left").classList.remove("inactive")
      if (menuIndex === 4){
        document.getElementById("scroll-right").classList.add("inactive");
      }
      scroll();
    }
  }, 1000);
}

function animateValue(cssQuery, value) {
    var duration = 1000;
    var obj = document.querySelector(cssQuery);
    var range = value;
    var minTimer = 50;

    var stepTime = Math.abs(Math.floor(duration / range));
    stepTime = Math.max(stepTime, minTimer);

    let endTime = new Date().getTime() + duration;
    let timer;

    function run() {
        let now = new Date().getTime();
        let remaining = Math.max((endTime - now) / duration, 0);
        let val = Math.round(value - (remaining * range));
        obj.innerHTML = val;
        if (val == value) {
            clearInterval(timer);
        }
    }

    timer = setInterval(run, stepTime);
    run();
}

function closeMenu(){
  document.getElementById('hamburger').checked = false;
}

function preventClosing(event) {
  event.stopPropagation();
}
