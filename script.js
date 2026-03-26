const STORAGE_KEY = "tier_v3";

let state = {
  characters: [],
  draggedId: null,
  search: ""
};

const base = [
{id:1,name:"Jinshi",img:"images/Jinshi.png",tier:"pool"},
{id:2,name:"Changli",img:"images/Changli.png",tier:"pool"},
{id:3,name:"Yinlin",img:"images/Yinlin.png",tier:"pool"}
];

function load(){
  const saved = localStorage.getItem(STORAGE_KEY);

  if(saved){
    const map = new Map(JSON.parse(saved).map(c=>[c.id,c]));
    base.forEach(c=>{
      if(!map.has(c.id)) map.set(c.id,c);
    });
    state.characters = Array.from(map.values());
  }else{
    state.characters = [...base];
  }
}

function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.characters));
}

function createCard(c){
  const card = document.createElement("div");
  card.className = "card";
  card.dataset.id = c.id;

  card.innerHTML = `
    <img src="${c.img}">
    <div>${c.name}</div>
  `;

  card.draggable = true;
  card.addEventListener("dragstart",()=> state.draggedId = c.id);

  card.addEventListener("touchstart",()=> {
    state.draggedId = c.id;
  });

  return card;
}

function render(){
  document.querySelectorAll(".dropzone").forEach(z=>z.innerHTML="");

  state.characters
    .filter(c=>c.name.toLowerCase().includes(state.search))
    .forEach(c=>{
      const zone = document.querySelector(`[data-tier="${c.tier}"]`);
      zone.appendChild(createCard(c));
    });
}

document.querySelectorAll(".dropzone").forEach(zone=>{

  zone.addEventListener("dragover", e=>e.preventDefault());

  zone.addEventListener("drop", ()=>{
    moveTo(zone.dataset.tier);
  });

  zone.addEventListener("touchend", ()=>{
    moveTo(zone.dataset.tier);
  });

});

function moveTo(tier){
  if(!state.draggedId) return;

  const char = state.characters.find(c=>c.id == state.draggedId);
  if(!char) return;

  char.tier = tier;

  save();
  render();
}

document.getElementById("search").addEventListener("input", e=>{
  state.search = e.target.value.toLowerCase();
  render();
});

document.getElementById("upload").addEventListener("change", e=>{
  const file = e.target.files[0];
  if(!file) return;

  const reader = new FileReader();

  reader.onload = function(ev){
    state.characters.push({
      id: Date.now(),
      name: file.name.split(".")[0],
      img: ev.target.result,
      tier:"pool"
    });

    save();
    render();
  };

  reader.readAsDataURL(file);
});

function resetTier(){
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}

function downloadImage(){
  html2canvas(document.body,{scale:2}).then(canvas=>{
    const a=document.createElement("a");
    a.href = canvas.toDataURL();
    a.download="tier.png";
    a.click();
  });
}

load();
render();
