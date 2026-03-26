const STORAGE_KEY = "tier_meta_v1";

let state = {
  characters: [],
  tiers: ["S","A","B","C","pool"],
  colors: {},
  draggedId: null,
  search: ""
};

// LOAD
function load(){
  const params = new URLSearchParams(location.search);

  if(params.get("data")){
    state = JSON.parse(atob(params.get("data")));
    return;
  }

  const saved = localStorage.getItem(STORAGE_KEY);
  if(saved){
    state = JSON.parse(saved);
  }
}

// SAVE
function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// RENDER
function render(){
  const container = document.getElementById("tiers");
  container.innerHTML = "";

  state.tiers.forEach(tier=>{
    const color = state.colors[tier] || "#444";

    const div = document.createElement("div");
    div.className = "tier";

    div.innerHTML = `
      <span ondblclick="renameTier('${tier}')" style="background:${color}">
        ${tier}
      </span>

      ${tier !== "pool" ? `<button onclick="deleteTier('${tier}')">X</button>` : ""}

      <input type="color" value="${color}" onchange="changeColor('${tier}', this.value)">

      <div class="dropzone" data-tier="${tier}"></div>
    `;

    container.appendChild(div);
  });

  renderCards();
  attachDrop();
}

// CARDS
function renderCards(){
  document.querySelectorAll(".dropzone").forEach(z=>z.innerHTML="");

  state.characters
    .filter(c=>c.name.toLowerCase().includes(state.search))
    .sort((a,b)=>a.order - b.order)
    .forEach(c=>{

      const zone = document.querySelector(`[data-tier="${c.tier}"]`);
      if(!zone) return;

      const card = document.createElement("div");
      card.className = "card";
      card.dataset.id = c.id;

      card.innerHTML = `
        <img src="${c.img}">
        <div>${c.name}</div>
      `;

      card.draggable = true;
      card.addEventListener("dragstart",()=> state.draggedId = c.id);

      zone.appendChild(card);
    });
}

// DROP SYSTEM (PC)
function attachDrop(){
  document.querySelectorAll(".dropzone").forEach(zone=>{

    zone.addEventListener("dragover", e=>{
      e.preventDefault();

      const afterElement = getDragAfterElement(zone, e.clientX);
      const dragging = document.querySelector(".dragging");

      if(!dragging) return;

      if(afterElement == null){
        zone.appendChild(dragging);
      } else {
        zone.insertBefore(dragging, afterElement);
      }
    });

    zone.addEventListener("drop", ()=>{
      updateAllOrders();
      save();
    });

  });
}

// DRAG POSITION
function getDragAfterElement(container, x){
  const cards = [...container.querySelectorAll(".card:not(.dragging)")];

  return cards.reduce((closest, child)=>{
    const box = child.getBoundingClientRect();
    const offset = x - box.left - box.width / 2;

    if(offset < 0 && offset > closest.offset){
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// UPDATE ORDER
function updateAllOrders(){
  document.querySelectorAll(".dropzone").forEach(zone=>{

    const tier = zone.dataset.tier;
    const cards = zone.querySelectorAll(".card");

    cards.forEach((card, index)=>{
      const id = Number(card.dataset.id);
      const char = state.characters.find(c=>c.id === id);

      if(char){
        char.tier = tier;
        char.order = index;
      }
    });

  });
}

// MOBILE TOUCH DRAG
let touchItem = null;

document.addEventListener("touchstart", e=>{
  const card = e.target.closest(".card");
  if(!card) return;

  touchItem = card;
  card.classList.add("dragging");
});

document.addEventListener("touchmove", e=>{
  if(!touchItem) return;

  const touch = e.touches[0];
  const elem = document.elementFromPoint(touch.clientX, touch.clientY);

  const zone = elem?.closest(".dropzone");
  if(!zone) return;

  const afterElement = getDragAfterElement(zone, touch.clientX);

  if(afterElement == null){
    zone.appendChild(touchItem);
  } else {
    zone.insertBefore(touchItem, afterElement);
  }
});

document.addEventListener("touchend", ()=>{
  if(!touchItem) return;

  touchItem.classList.remove("dragging");
  updateAllOrders();
  save();
  touchItem = null;
});

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

// ADD TIER
function addTier(){
  const name = prompt("Tier name:");
  if(!name) return;

  state.tiers.splice(state.tiers.length - 1, 0, name);
  save();
  render();
}

// DELETE TIER
function deleteTier(tier){
  if(!confirm("Delete tier?")) return;

  state.characters.forEach(c=>{
    if(c.tier === tier){
      c.tier = "pool";
    }
  });

  state.tiers = state.tiers.filter(t=>t !== tier);

  save();
  render();
}

// RENAME
function renameTier(oldName){
  const newName = prompt("Rename:", oldName);
  if(!newName) return;

  state.tiers = state.tiers.map(t => t === oldName ? newName : t);

  state.characters.forEach(c=>{
    if(c.tier === oldName){
      c.tier = newName;
    }
  });

  save();
  render();
}

// COLOR
function changeColor(tier, color){
  state.colors[tier] = color;
  save();
  render();
}

// SEARCH
document.getElementById("search").addEventListener("input", e=>{
  state.search = e.target.value.toLowerCase();
  render();
});

// UPLOAD
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
        name,
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

// EXPORT
function exportData(){
  const data = JSON.stringify(state);
  const blob = new Blob([data], {type:"application/json"});

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "tier.json";
  a.click();
}

// IMPORT
function importData(e){
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = function(ev){
    state = JSON.parse(ev.target.result);
    save();
    render();
  };

  reader.readAsText(file);
}

// SHARE
function getShareLink(){
  const data = btoa(JSON.stringify(state));
  const url = location.origin + location.pathname + "?data=" + data;

  prompt("Copy this link:", url);
}

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

// INIT
load();
render();
