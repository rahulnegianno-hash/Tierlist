const STORAGE_KEY = "tier_final_v1";

let state = {
  characters: [],
  draggedId: null,
  search: ""
};

// LOAD
function load(){
  const saved = localStorage.getItem(STORAGE_KEY);
  if(saved){
    state.characters = JSON.parse(saved);
  }
}

// SAVE
function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.characters));
}

// CREATE CARD
function createCard(c){
  const card = document.createElement("div");
  card.className = "card";
  card.dataset.id = c.id;

  card.innerHTML = `
    <img src="${c.img}">
    <div>${c.name}</div>
  `;

  // PC
  card.draggable = true;
  card.addEventListener("dragstart",()=> state.draggedId = c.id);

  return card;
}

// RENDER
function render(){
  document.querySelectorAll(".dropzone").forEach(z=>z.innerHTML="");

  state.characters
    .filter(c=>c.name.toLowerCase().includes(state.search))
    .sort((a,b)=>a.order - b.order)
    .forEach(c=>{
      const zone = document.querySelector(`[data-tier="${c.tier}"]`);
      zone.appendChild(createCard(c));
    });
}

// MOVE
function moveTo(tier){
  const char = state.characters.find(c=>c.id == state.draggedId);
  if(!char) return;

  char.tier = tier;
  updateOrder(tier);
  save();
  render();
}

// DROP SYSTEM
document.querySelectorAll(".dropzone").forEach(zone=>{

  zone.addEventListener("dragover", e=>e.preventDefault());

  zone.addEventListener("drop", ()=>{
    moveTo(zone.dataset.tier);
  });

});

// ORDER
function updateOrder(tier){
  const cards = document.querySelector(`[data-tier="${tier}"]`).children;

  [...cards].forEach((card,index)=>{
    const id = Number(card.dataset.id);
    const char = state.characters.find(c=>c.id === id);

    if(char){
      char.order = index;
    }
  });
}

// SEARCH
document.getElementById("search").addEventListener("input", e=>{
  state.search = e.target.value.toLowerCase();
  render();
});

// 🔥 AUTO NAME UPLOAD
document.getElementById("upload").addEventListener("change", e=>{
  const files = Array.from(e.target.files);

  files.forEach(file=>{
    const reader = new FileReader();

    reader.onload = function(ev){

      let name = file.name.split(".")[0];

      name = name
        .replace(/[_-]/g, " ")
        .replace(/\b\w/g, l => l.toUpperCase());

      state.characters.push({
        id: Date.now() + Math.random(),
        name: name,
        img: ev.target.result,
        tier:"pool",
        order: Date.now()
      });

      save();
      render();
    };

    reader.readAsDataURL(file);
  });
});

// RESET
function resetTier(){
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}

// DOWNLOAD
function downloadImage(){
  html2canvas(document.body,{scale:2}).then(canvas=>{
    const a=document.createElement("a");
    a.href = canvas.toDataURL();
    a.download="tier.png";
    a.click();
  });
}

// DRAG STYLE
document.addEventListener("dragstart", e=>{
  if(e.target.classList.contains("card")){
    e.target.classList.add("dragging");
  }
});

document.addEventListener("dragend", e=>{
  if(e.target.classList.contains("card")){
    e.target.classList.remove("dragging");
  }
});

// INIT
load();
render();
