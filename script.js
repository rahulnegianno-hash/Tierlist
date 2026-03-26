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
  if(saved) state = JSON.parse(saved);
}

function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render(){
  const container = document.getElementById("tiers");
  container.innerHTML = "";

  state.tiers.forEach(tier=>{
    const div = document.createElement("div");
    div.className = "tier";

    div.innerHTML = `
      <span ondblclick="renameTier('${tier}')">${tier}</span>
      ${tier !== "pool" ? `<button data-tier="${tier}" class="del">X</button>` : ""}
      <div class="dropzone" data-tier="${tier}"></div>
    `;

    container.appendChild(div);
  });

  document.querySelectorAll(".del").forEach(btn=>{
    btn.onclick = ()=> deleteTier(btn.dataset.tier);
  });

  renderCards();
  attachDrop();
}

function renderCards(){
  document.querySelectorAll(".dropzone").forEach(z=>z.innerHTML="");

  state.characters
    .filter(c=>c.name.toLowerCase().includes(state.search))
    .forEach(c=>{
      const zone = document.querySelector(`[data-tier="${c.tier}"]`);
      if(!zone) return;

      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `<img src="${c.img}"><div>${c.name}</div>`;

      card.draggable = true;

      card.addEventListener("dragstart", ()=>{
        state.draggedId = c.id;
        card.classList.add("dragging");
      });

      card.addEventListener("dragend", ()=>{
        card.classList.remove("dragging");
      });

      zone.appendChild(card);
    });
}

function attachDrop(){
  document.querySelectorAll(".dropzone").forEach(zone=>{
    zone.addEventListener("dragover", e=>{
      e.preventDefault();
    });

    zone.addEventListener("drop", ()=>{
      const char = state.characters.find(c=>c.id === state.draggedId);
      if(char){
        char.tier = zone.dataset.tier;
      }
      save();
      render();
    });
  });
}

function addTier(){
  let name = prompt("Tier name:");
  if(!name) return;

  if(state.tiers.includes(name)) return alert("Already exists");

  state.tiers.splice(state.tiers.length-1,0,name);
  save();
  render();
}

function deleteTier(tier){
  state.characters.forEach(c=>{
    if(c.tier === tier) c.tier="pool";
  });

  state.tiers = state.tiers.filter(t=>t!==tier);
  save();
  render();
}

function renameTier(oldName){
  const newName = prompt("Rename:", oldName);
  if(!newName) return;

  state.tiers = state.tiers.map(t=>t===oldName?newName:t);

  state.characters.forEach(c=>{
    if(c.tier===oldName) c.tier=newName;
  });

  save();
  render();
}

document.getElementById("search").addEventListener("input", e=>{
  state.search = e.target.value.toLowerCase();
  render();
});

document.getElementById("upload").addEventListener("change", e=>{
  Array.from(e.target.files).forEach(file=>{
    const reader = new FileReader();

    reader.onload = ev=>{
      state.characters.push({
        id: Date.now()+Math.random(),
        name: file.name.split(".")[0],
        img: ev.target.result,
        tier:"pool"
      });

      save();
      render();
    };

    reader.readAsDataURL(file);
  });
});

/* ✅ FIXED IMPORT */
function importData(e){
  const file = e.target.files[0];
  if(!file) return;

  const reader = new FileReader();

  reader.onload = ev=>{
    try{
      const data = JSON.parse(ev.target.result);

      if(!data.characters || !data.tiers){
        alert("Invalid file");
        return;
      }

      state = {
        characters: data.characters,
        tiers: data.tiers,
        colors: data.colors || {},
        draggedId:null,
        search:""
      };

      save();
      render();
      alert("Import success ✅");

    }catch{
      alert("Import failed ❌");
    }

    e.target.value="";
  };

  reader.readAsText(file);
}

function exportData(){
  const blob = new Blob([JSON.stringify(state)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "tier.json";
  a.click();
}

function getShareLink(){
  const data = btoa(JSON.stringify(state));
  prompt("Copy:", location.href+"?data="+data);
}

function resetTier(){
  localStorage.clear();
  location.reload();
}

function downloadImage(){
  html2canvas(document.body).then(canvas=>{
    const a=document.createElement("a");
    a.href=canvas.toDataURL();
    a.download="tier.png";
    a.click();
  });
}

load();
render();
