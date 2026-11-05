// Mini Pokédex: browse, search and filter Pokémon, then build a team of up to six.
// No libraries and no internet needed. The team is saved in the browser with localStorage.

var MAX_TEAM = 6;
var STORAGE_KEY = 'mini-pokedex-team';

// The data: one object per Pokémon.
var POKEMON = [
  { id: 1,   name: 'Bulbasaur',  types: ['Grass', 'Poison'],  kind: 'Seed Pokémon' },
  { id: 4,   name: 'Charmander', types: ['Fire'],             kind: 'Lizard Pokémon' },
  { id: 7,   name: 'Squirtle',   types: ['Water'],            kind: 'Tiny Turtle Pokémon' },
  { id: 25,  name: 'Pikachu',    types: ['Electric'],         kind: 'Mouse Pokémon' },
  { id: 39,  name: 'Jigglypuff', types: ['Normal', 'Fairy'],  kind: 'Balloon Pokémon' },
  { id: 94,  name: 'Gengar',     types: ['Ghost', 'Poison'],  kind: 'Shadow Pokémon' },
  { id: 133, name: 'Eevee',      types: ['Normal'],           kind: 'Evolution Pokémon' },
  { id: 143, name: 'Snorlax',    types: ['Normal'],           kind: 'Sleeping Pokémon' }
];

var TYPES = ['All', 'Electric', 'Fire', 'Water', 'Grass', 'Normal', 'Poison', 'Ghost', 'Fairy'];

var currentType = 'All';
var searchText = '';
var team = loadTeam(); // an array of Pokémon ids

// Grab the parts of the page we need.
var grid = document.getElementById('grid');
var filters = document.getElementById('filters');
var searchBox = document.getElementById('search');
var statusLine = document.getElementById('status');
var teamList = document.getElementById('team-list');
var teamEmpty = document.getElementById('team-empty');
var teamCount = document.getElementById('team-count');
var clearButton = document.getElementById('clear');

// ---------- saving and loading ----------
function loadTeam() {
  try {
    var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(saved)) { return []; }
    return saved.filter(function (id) { return findPokemon(id); }).slice(0, MAX_TEAM);
  } catch (error) {
    return []; // storage blocked or broken: start with an empty team
  }
}

function saveTeam() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(team));
  } catch (error) {
    // If saving fails, the page still works. The team just is not remembered.
  }
}

function findPokemon(id) {
  for (var i = 0; i < POKEMON.length; i++) {
    if (POKEMON[i].id === id) { return POKEMON[i]; }
  }
  return null;
}

// ---------- small helpers that build page elements ----------
function make(tag, className, text) {
  var el = document.createElement(tag);
  if (className) { el.className = className; }
  if (text) { el.textContent = text; }
  return el;
}

function dexNumber(id) {
  return '#' + String(id).padStart(3, '0');
}

// ---------- the type filter buttons ----------
function drawFilters() {
  filters.innerHTML = '';
  TYPES.forEach(function (type) {
    var button = make('button', '', type);
    button.type = 'button';
    button.setAttribute('aria-pressed', String(type === currentType));
    button.addEventListener('click', function () {
      currentType = type;
      drawFilters();
      drawCards();
    });
    filters.appendChild(button);
  });
}

// ---------- the Pokémon cards ----------
function matches(pokemon) {
  var typeOk = currentType === 'All' || pokemon.types.indexOf(currentType) !== -1;
  var nameOk = pokemon.name.toLowerCase().indexOf(searchText.toLowerCase()) !== -1;
  return typeOk && nameOk;
}

function drawCards() {
  var shown = POKEMON.filter(matches);
  grid.innerHTML = '';

  shown.forEach(function (pokemon) {
    var inTeam = team.indexOf(pokemon.id) !== -1;
    var card = make('article', 'card' + (inTeam ? ' in-team' : ''));

    var art = make('div', 't-' + pokemon.types[0] + ' art', dexNumber(pokemon.id));
    art.setAttribute('aria-hidden', 'true');

    var types = make('div', 'types');
    pokemon.types.forEach(function (type) {
      types.appendChild(make('span', 'chip t-' + type, type));
    });

    var button = make('button', '', inTeam ? 'Remove from team' : 'Add to team');
    button.type = 'button';
    button.setAttribute('aria-label', (inTeam ? 'Remove ' : 'Add ') + pokemon.name + (inTeam ? ' from team' : ' to team'));
    button.addEventListener('click', function () { toggleTeam(pokemon.id); });

    card.appendChild(art);
    card.appendChild(make('h3', '', pokemon.name));
    card.appendChild(make('p', 'dex', dexNumber(pokemon.id) + ' · ' + pokemon.kind));
    card.appendChild(types);
    card.appendChild(button);
    grid.appendChild(card);
  });

  if (shown.length === 0) {
    statusLine.textContent = 'No Pokémon match. Try another type or clear the search.';
  } else {
    statusLine.textContent = 'Showing ' + shown.length + ' of ' + POKEMON.length + ' Pokémon.';
  }
}

// ---------- the team ----------
function toggleTeam(id) {
  var position = team.indexOf(id);
  var pokemon = findPokemon(id);

  if (position !== -1) {
    team.splice(position, 1);
    statusLine.textContent = pokemon.name + ' was removed from your team.';
  } else if (team.length >= MAX_TEAM) {
    statusLine.textContent = 'Your team is full. Remove one Pokémon first.';
    return;
  } else {
    team.push(id);
    statusLine.textContent = pokemon.name + ' joined your team.';
  }

  saveTeam();
  drawTeam();
  drawCardsKeepStatus();
}

// Redraw the cards without replacing the message we just wrote.
function drawCardsKeepStatus() {
  var message = statusLine.textContent;
  drawCards();
  statusLine.textContent = message;
}

function drawTeam() {
  teamList.innerHTML = '';
  teamCount.textContent = team.length + ' of ' + MAX_TEAM;
  teamEmpty.hidden = team.length > 0;
  clearButton.hidden = team.length === 0;

  team.forEach(function (id) {
    var pokemon = findPokemon(id);
    var item = make('li');
    item.appendChild(make('strong', '', pokemon.name));
    item.appendChild(make('span', 'dex', dexNumber(pokemon.id) + ' · ' + pokemon.types.join(' / ')));
    var remove = make('button', '', 'Remove');
    remove.type = 'button';
    remove.setAttribute('aria-label', 'Remove ' + pokemon.name + ' from team');
    remove.addEventListener('click', function () { toggleTeam(id); });
    item.appendChild(remove);
    teamList.appendChild(item);
  });
}

// ---------- start up ----------
searchBox.addEventListener('input', function () {
  searchText = searchBox.value.trim();
  drawCards();
});

clearButton.addEventListener('click', function () {
  team = [];
  saveTeam();
  drawTeam();
  drawCardsKeepStatus();
  statusLine.textContent = 'Your team was cleared.';
});

drawFilters();
drawCards();
drawTeam();
