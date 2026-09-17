const state = {
  players: [],
  rounds: 3,
  round: 1,
  turn: 0,
  target: 0,
  startedAt: 0,
  running: false,
  results: []
};

const $ = (selector) => document.querySelector(selector);
const screens = ['setup', 'play', 'round', 'scoreboard', 'final'];

function showScreen(name) {
  screens.forEach((screen) => $(`#${screen}-screen`).classList.toggle('hidden', screen !== name));
  $('#restart-button').classList.toggle('hidden', name === 'setup');
  $('#top-left').textContent = name === 'setup' || name === 'final' ? 'Jogo offline' : `Rodada ${state.round} de ${state.rounds}`;
  $('#top-right').textContent = name === 'setup' || name === 'final' ? '' : `${state.turn + 1}/${state.players.length}`;
}

function formatSeconds(value) {
  return value.toFixed(2).padStart(5, '0');
}

function randomTarget() {
  return Math.random() * 12;
}

function renderPlayers() {
  $('#player-list').innerHTML = state.players.map((player, index) => `
    <div class="player-row"><span>${escapeHtml(player.name)}</span><button type="button" data-remove="${index}" aria-label="Remover ${escapeHtml(player.name)}">×</button></div>
  `).join('');
  $('#player-total').textContent = `${state.players.length}/6`;
  $('#start-game').disabled = state.players.length === 0;
  $('#start-game').textContent = state.players.length ? 'Começar jogo' : 'Adicione pelo menos 1 jogador';
  document.querySelectorAll('[data-remove]').forEach((button) => button.addEventListener('click', () => {
    state.players.splice(Number(button.dataset.remove), 1);
    renderPlayers();
  }));
}

function addPlayer() {
  const input = $('#player-name');
  const name = input.value.trim();
  if (!name || state.players.length >= 6) return;
  state.players.push({ name, score: 0, results: [] });
  input.value = '';
  renderPlayers();
  input.focus();
}

function startGame() {
  state.round = 1;
  state.turn = 0;
  state.results = [];
  state.players.forEach((player) => { player.score = 0; player.results = []; });
  startRound();
}

function startRound() {
  state.target = randomTarget();
  state.turn = 0;
  state.results = [];
  startTurn();
}

function startTurn() {
  state.running = false;
  const player = state.players[state.turn];
  $('#current-player').textContent = player.name;
  $('#round-label').textContent = `Rodada ${state.round} de ${state.rounds}`;
  $('#turn-label').textContent = `${state.turn + 1}/${state.players.length}`;
  $('#target-label').textContent = `${formatSeconds(state.target)}s`;
  $('#secret-readout').textContent = 'Pronto?';
  $('#secret-hint').textContent = 'Aperte começar e pare no alvo.';
  $('#secret-ring').classList.remove('running');
  $('#timer-button').textContent = 'Começar';
  $('#timer-button').className = 'big-button go';
  $('#pass-note').textContent = 'Quando começar, não haverá relógio na tela.';
  showScreen('play');
}

function stopTimer() {
  state.running = false;
  window.clearInterval(state.ticker);
  const elapsed = (performance.now() - state.startedAt) / 1000;
  const diff = Math.abs(elapsed - state.target);
  const result = { player: state.players[state.turn].name, elapsed, diff, target: state.target };
  state.results.push(result);
  state.players[state.turn].results.push(result);
  state.players[state.turn].score += Math.max(0, Math.round(100 - diff * 8.333));
  $('#round-summary-text').textContent = 'Palpite registrado.';
  $('#round-summary-detail').textContent = `${formatSeconds(elapsed)}s · resultado no placar`;
  showScreen('round');
}

function showRoundScoreboard() {
  $('#round-target').textContent = formatSeconds(state.target);
  $('#round-scoreboard').innerHTML = [...state.results].sort((a, b) => a.diff - b.diff).map((result, index) => `
    <div class="score-row ${index === 0 ? 'leader' : ''}"><span>${String(index + 1).padStart(2, '0')}</span><strong>${escapeHtml(result.player)}</strong><small>parou em ${formatSeconds(result.elapsed)}s <b class="direction ${result.elapsed < result.target ? 'lower' : result.elapsed > result.target ? 'higher' : 'exact'}">${result.elapsed < result.target ? '↓' : result.elapsed > result.target ? '↑' : '='} ${formatSeconds(result.diff)}s ${result.elapsed < result.target ? 'menor' : result.elapsed > result.target ? 'maior' : 'exato'}</b></small></div>
  `).join('');
  $('#continue-round').textContent = state.round === state.rounds ? 'Ver resultado final →' : 'Próxima rodada →';
  showScreen('scoreboard');
}

function scoreRows() {
  return [...state.players].sort((a, b) => b.score - a.score).map((player, index) => `
    <div class="score-row ${index === 0 ? 'leader' : ''}"><span>${String(index + 1).padStart(2, '0')}</span><strong>${escapeHtml(player.name)}</strong><small>${player.score} pontos</small></div>
  `).join('');
}

function showFinal() {
  const ranked = [...state.players].sort((a, b) => b.score - a.score);
  $('#winner-name').textContent = ranked[0]?.name || '-';
  $('#final-scoreboard').innerHTML = scoreRows();
  $('#revealed-rounds').innerHTML = `<p class="kicker">Metas reveladas</p>${state.players[0].results.map((result, index) => `<div><span>Rodada ${index + 1}</span><strong>${formatSeconds(result.target)}s</strong></div>`).join('')}`;
  showScreen('final');
}

function resetGame() {
  state.round = 1;
  state.turn = 0;
  state.results = [];
  renderPlayers();
  showScreen('setup');
}

function escapeHtml(value) {
  const element = document.createElement('div');
  element.textContent = value;
  return element.innerHTML;
}

$('#add-player').addEventListener('click', addPlayer);
$('#player-name').addEventListener('keydown', (event) => { if (event.key === 'Enter') addPlayer(); });
document.querySelectorAll('[data-rounds]').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('[data-rounds]').forEach((item) => item.classList.remove('active'));
  button.classList.add('active');
  state.rounds = Number(button.dataset.rounds);
}));
$('#start-game').addEventListener('click', startGame);
$('#timer-button').addEventListener('click', () => {
  if (!state.running) {
    state.running = true;
    state.startedAt = performance.now();
    $('#secret-readout').textContent = '...';
    $('#secret-hint').textContent = 'Pare quando chegar à meta.';
    $('#secret-ring').classList.add('running');
    $('#timer-button').textContent = 'Parar';
    $('#timer-button').className = 'big-button stop';
  } else stopTimer();
});
$('#next-turn').addEventListener('click', () => {
  if (state.turn + 1 < state.players.length) {
    state.turn += 1;
    startTurn();
  } else showRoundScoreboard();
});
$('#continue-round').addEventListener('click', () => {
  if (state.round === state.rounds) showFinal();
  else { state.round += 1; startRound(); }
});
$('#play-again').addEventListener('click', resetGame);
$('#restart-button').addEventListener('click', resetGame);
$('#theme-button').addEventListener('click', () => {
  document.documentElement.dataset.theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
});

renderPlayers();
showScreen('setup');
