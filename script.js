const state = {
  players: [],
  format: 'single',
  rounds: 1,
  round: 1,
  turn: 0,
  target: 0,
  startedAt: 0,
  running: false,
  results: [],
  roundHistory: [],
  activePlayers: [],
  eliminated: []
};

const $ = (selector) => document.querySelector(selector);
const screens = ['setup', 'play', 'round', 'scoreboard', 'final'];

function showScreen(name) {
  screens.forEach((screen) => $(`#${screen}-screen`).classList.toggle('hidden', screen !== name));
  $('#restart-button').classList.toggle('hidden', name === 'setup');
  $('#top-left').textContent = name === 'setup' || name === 'final' ? 'Jogo offline' : `Rodada ${state.round}`;
  $('#top-right').textContent = name === 'setup' || name === 'final' ? '' : `${state.turn + 1}/${state.activePlayers.length}`;
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
  state.roundHistory = [];
  state.activePlayers = [...state.players];
  state.eliminated = [];
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
  const player = state.activePlayers[state.turn];
  $('#current-player').textContent = player.name;
  $('#round-label').textContent = state.format === 'elimination' ? `Rodada ${state.round} · ${state.activePlayers.length} na disputa` : 'Rodada única';
  $('#turn-label').textContent = `${state.turn + 1}/${state.activePlayers.length}`;
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
  const result = { player: state.activePlayers[state.turn].name, elapsed, diff, target: state.target };
  state.results.push(result);
  state.activePlayers[state.turn].results.push(result);
  $('#round-summary-text').textContent = 'Palpite registrado.';
  $('#round-summary-detail').textContent = `${formatSeconds(elapsed)}s · resultado no placar`;
  showScreen('round');
}

function showRoundScoreboard() {
  state.roundHistory.push({ target: state.target, results: [...state.results] });
  $('#round-scoreboard').innerHTML = [...state.results].sort((a, b) => a.diff - b.diff).map((result, index) => `
    <div class="score-row ${index === 0 ? 'leader' : ''} ${state.format === 'elimination' && index === state.results.length - 1 ? 'disqualified-row' : ''}"><span>${String(index + 1).padStart(2, '0')}</span><strong>${escapeHtml(result.player)}${index === 0 ? '<b class="round-winner">melhor da rodada</b>' : ''}${state.format === 'elimination' ? index === state.results.length - 1 ? '<b class="disqualified">desclassificado</b>' : '<b class="classified">classificado</b>' : ''}</strong><small>meta ${formatSeconds(result.target)}s · realizado ${formatSeconds(result.elapsed)}s · <b class="direction ${result.elapsed < result.target ? 'lower' : result.elapsed > result.target ? 'higher' : 'exact'}">${result.elapsed < result.target ? '↓' : result.elapsed > result.target ? '↑' : '='} ${formatSeconds(result.diff)}s ${result.elapsed < result.target ? 'menor' : result.elapsed > result.target ? 'maior' : 'exato'}</b></small></div>
  `).join('');
  $('#continue-round').textContent = state.format === 'single' ? 'Ver resultado final →' : 'Próxima rodada →';
  showScreen('scoreboard');
}

function scoreRows(players = state.players) {
  const ranked = state.format === 'elimination' ? players : [...players].sort((a, b) => b.score - a.score);
  return ranked.map((player, index) => `
    <div class="score-row ${index === 0 ? 'leader' : ''}"><span>${String(index + 1).padStart(2, '0')}</span><strong>${escapeHtml(player.name)}</strong><small>${state.format === 'single' ? (index === 0 ? 'melhor da rodada' : '') : index === 0 ? 'campeão' : `desclassificado na rodada ${player.results.length}`}</small></div>
  `).join('');
}

function showFinal() {
  const ranked = state.format === 'elimination' ? [state.activePlayers[0], ...state.eliminated].filter(Boolean) : [...state.players].sort((a, b) => b.score - a.score);
  $('#winner-name').textContent = ranked[0]?.name || '-';
  $('#final-scoreboard').innerHTML = scoreRows(ranked);
  $('#revealed-rounds').innerHTML = `<p class="kicker">Resultado de cada rodada</p>${state.roundHistory.map((round, roundIndex) => `
    <article class="revealed-round"><div class="revealed-round-heading"><strong>Rodada ${roundIndex + 1}</strong></div>
    ${[...round.results].sort((a, b) => a.diff - b.diff).map((result, resultIndex, rankedResults) => `<div class="revealed-result ${resultIndex === 0 ? 'round-result-winner' : ''} ${state.format === 'elimination' && resultIndex === rankedResults.length - 1 ? 'disqualified-row' : ''}"><strong>${escapeHtml(result.player)}${resultIndex === 0 ? '<b class="round-winner">melhor da rodada</b>' : ''}${state.format === 'elimination' ? resultIndex === rankedResults.length - 1 ? '<b class="disqualified">desclassificado</b>' : '<b class="classified">classificado</b>' : ''}</strong><span>meta ${formatSeconds(result.target)}s · realizado ${formatSeconds(result.elapsed)}s</span><b class="direction ${result.elapsed < result.target ? 'lower' : result.elapsed > result.target ? 'higher' : 'exact'}">${result.elapsed < result.target ? '↓' : result.elapsed > result.target ? '↑' : '='} ${formatSeconds(result.diff)}s ${result.elapsed < result.target ? 'menor' : result.elapsed > result.target ? 'maior' : 'exato'}</b></div>`).join('')}</article>
  `).join('')}`;
  showScreen('final');
}

function resetGame() {
  state.round = 1;
  state.turn = 0;
  state.results = [];
  state.roundHistory = [];
  state.activePlayers = [];
  state.eliminated = [];
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
document.querySelectorAll('[data-format]').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('[data-format]').forEach((item) => item.classList.remove('active'));
  button.classList.add('active');
  state.format = button.dataset.format;
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
  if (state.turn + 1 < state.activePlayers.length) {
    state.turn += 1;
    startTurn();
  } else showRoundScoreboard();
});
$('#continue-round').addEventListener('click', () => {
  if (state.format === 'single') showFinal();
  else {
    const worst = [...state.results].sort((a, b) => b.diff - a.diff)[0];
    const eliminatedPlayer = state.activePlayers.find((player) => player.name === worst.player);
    state.eliminated.unshift(eliminatedPlayer);
    state.activePlayers = state.activePlayers.filter((player) => player !== eliminatedPlayer);
    if (state.activePlayers.length === 1) showFinal();
    else { state.round += 1; startRound(); }
  }
});
$('#play-again').addEventListener('click', resetGame);
$('#restart-button').addEventListener('click', resetGame);
$('#theme-button').addEventListener('click', () => {
  document.documentElement.dataset.theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
});
$('#rules-button').addEventListener('click', () => $('#rules-panel').classList.remove('hidden'));
$('#close-rules').addEventListener('click', () => $('#rules-panel').classList.add('hidden'));
$('#rules-backdrop').addEventListener('click', () => $('#rules-panel').classList.add('hidden'));

renderPlayers();
showScreen('setup');
