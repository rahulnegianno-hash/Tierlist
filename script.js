const STORAGE_KEY = "tier_meta_v2";

let state = {
  characters: [],
  tiers: ["S","A","B","C","pool"],
  colors: {},
  draggedId: null,
  search: ""
};

function load(){
  const saved = localStorage.getItem(STORAGE_KEY);
  if(saved){
    state = JSON.parse(saved);
  }
}

function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render(){
  const container = document.getElementById("tiers");
  container.innerHTML = "";

  state.tiers.forEach(tier=>{
    const color = state.colors[tier] || "#444";

    const div = document.createElement("div");
    div.className = "tier";

    div.innerHTML = `
      <span style="background:${color}" ondblclick="renameTier('${tier}')">${tier}</span>
      ${tier !== "pool" ? `<button onclick="deleteTier('${tier}')">X</button>` : ""}
      <input type="color" value="${color}" onchange="changeColor('${tier}', this.value)">
      <div class="dropzone" data-tier="${tier}"></div>
    `;

    container.appendChild(div);
  });

  renderCards();
  attachDrop();
}

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

      card.addEventListener("dragstart", ()=>{
        state.draggedId = c.id;
        card.classList.add("dragging");
      });

      zone.appendChild(card);
    });
}

function attachDrop(){
  document.querySelectorAll(".dropzone").forEach(zone=>{

    zone.addEventListener("dragover", e=>{
      e.preventDefault();

      const dragging = document.querySelector(".dragging");
      if(!dragging) return;

      zone.appendChild(dragging);
    });

    zone.addEventListener("drop", ()=>{
      updateAllOrders();
      save();
    });

  });
}

function updateAllOrders(){
  document.querySelectorAll(".dropzone").forEach(zone=>{
    const tier = zone.dataset.tier;

    zone.querySelectorAll(".card").forEach((card,index)=>{
      const id = Number(card.dataset.id);
      const char = state.characters.find(c=>c.id === id);

      if(char){
        char.tier = tier;
        char.order = index;
      }
    });
  });
}

document.addEventListener("dragend", e=>{
  if(e.target.classList.contains("card")){
    e.target.classList.remove("dragging");
  }
});

function addTier(){
  const name = prompt("Tier name:");
  if(!name) return;

  state.tiers.splice(state.tiers.length - 1, 0, name);
  save();
  render();
}

function deleteTier(tier){
  state.characters.forEach(c=>{
    if(c.tier === tier) c.tier = "pool";
  });

  state.tiers = state.tiers.filter(t=>t !== tier);
  save();
  render();
}

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

function changeColor(tier, color){
  state.colors[tier] = color;
  save();
  render();
}

document.getElementById("search").addEventListener("input", e=>{
  state.search = e.target.value.toLowerCase();
  render();
});

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

function exportData(){
  const data = JSON.stringify(state);
  const blob = new Blob([data]);

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "tier.json";
  a.click();
}

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

function getShareLink(){
  const data = btoa(JSON.stringify(state));
  const url = location.origin + location.pathname + "?data=" + data;

  prompt("Copy link:", url);
}

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
