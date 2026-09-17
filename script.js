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
  eliminated: [],
  doubtHistory: [],
  lastPasser: null,
  pausedElapsed: 0
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
  const enoughPlayers = state.format !== 'doubt' || state.players.length >= 2;
  $('#start-game').disabled = state.players.length === 0 || !enoughPlayers;
  $('#start-game').textContent = !enoughPlayers ? 'Adicione 2 jogadores' : state.players.length ? 'Começar jogo' : 'Adicione pelo menos 1 jogador';
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
  state.doubtHistory = [];
  state.lastPasser = null;
  state.pausedElapsed = 0;
  if (state.format === 'doubt' && state.players.length < 2) return;
  state.players.forEach((player) => { player.score = 0; player.results = []; player.pausedTimes = []; });
  if (state.format === 'doubt') startDoubtRound();
  else startRound();
}

function startRound() {
  state.target = randomTarget();
  state.turn = 0;
  state.results = [];
  startTurn();
}

function startTurn() {
  if (state.format === 'doubt') return startDoubtTurn();
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

function startDoubtRound() {
  state.target = randomTarget();
  state.startedAt = 0;
  state.running = false;
  state.turn = 0;
  state.lastPasser = null;
  state.pausedElapsed = 0;
  startDoubtTurn();
}

function startDoubtTurn() {
  const player = state.activePlayers[state.turn];
  const firstStart = state.turn === 0 && !state.lastPasser && !state.running;
  $('#current-player').textContent = player.name;
  $('#round-label').textContent = `Rodada ${state.round} · tempo correndo`;
  $('#turn-label').textContent = `${state.turn + 1}/${state.activePlayers.length}`;
  $('#target-caption').textContent = 'Meta desta rodada';
  $('#target-label').textContent = `${formatSeconds(state.target)}s`;
  $('#secret-readout').textContent = firstStart ? 'Pronto?' : state.lastPasser ? 'Tempo pausado' : 'Tempo correndo';
  $('#secret-hint').textContent = firstStart ? 'Toque para iniciar o tempo.' : state.lastPasser ? 'Aceite ou duvide do passe anterior.' : 'Bata para pausar e passe o celular.';
  $('#secret-ring').classList.toggle('running', state.running);
  $('#timer-button').textContent = firstStart ? 'Começar' : state.lastPasser ? 'Aceitar e continuar' : 'Bati · pausar';
  $('#timer-button').className = 'big-button go';
  $('#doubt-button').classList.toggle('hidden', !state.lastPasser);
  $('#pass-note').textContent = firstStart ? 'A primeira pessoa dá a largada.' : state.lastPasser ? `Pausado por ${state.lastPasser.name}` : 'O tempo corre e ninguém vê o relógio.';
  showScreen('play');
}

function startDoubtTimer() {
  state.running = true;
  state.startedAt = performance.now();
  startDoubtTurn();
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

function passDoubtTurn() {
  state.pausedElapsed = (performance.now() - state.startedAt) / 1000;
  state.running = false;
  state.lastPasser = state.activePlayers[state.turn];
  state.lastPasser.pausedTimes.push(state.pausedElapsed);
  state.turn = (state.turn + 1) % state.activePlayers.length;
  startDoubtTurn();
}

function continueDoubtTurn() {
  state.lastPasser = null;
  state.running = true;
  state.startedAt = performance.now() - state.pausedElapsed * 1000;
  startDoubtTurn();
}

function resolveDoubt() {
  const elapsed = state.pausedElapsed;
  const timePassed = elapsed > state.target;
  const doubter = state.activePlayers[state.turn];
  const challenged = state.lastPasser;
  const eliminated = timePassed ? challenged : doubter;
  const winner = timePassed ? doubter : challenged;
  state.doubtHistory.push({
    target: state.target,
    elapsed,
    doubter: doubter.name,
    challenged: challenged.name,
    eliminated: eliminated.name,
    timePassed,
    pausedTimes: state.players.map((player) => ({ name: player.name, times: [...(player.pausedTimes || [])] }))
  });
  state.eliminated.unshift(eliminated);
  state.activePlayers = state.activePlayers.filter((player) => player !== eliminated);
  $('#round-summary-text').textContent = timePassed ? 'Duvido certo!' : 'Duvido errado!';
  $('#round-summary-detail').textContent = timePassed ? `${doubter.name} acertou. ${challenged.name} saiu.` : `${doubter.name} errou. ${doubter.name} saiu.`;
  $('#next-turn').textContent = state.activePlayers.length === 1 ? 'Ver campeão →' : 'Próxima disputa →';
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
  const ranked = state.format === 'elimination' || state.format === 'doubt' ? players : [...players].sort((a, b) => b.score - a.score);
  return ranked.map((player, index) => `
    <div class="score-row ${index === 0 ? 'leader' : ''}"><span>${String(index + 1).padStart(2, '0')}</span><strong>${escapeHtml(player.name)}</strong><small>${state.format === 'single' ? (index === 0 ? 'melhor da rodada' : '') : index === 0 ? 'campeão' : `desclassificado na rodada ${player.results.length || 'da disputa'}`}</small></div>
  `).join('');
}

function showFinal() {
  const ranked = state.format === 'elimination' || state.format === 'doubt' ? [state.activePlayers[0], ...state.eliminated].filter(Boolean) : [...state.players].sort((a, b) => b.score - a.score);
  $('#winner-name').textContent = ranked[0]?.name || '-';
  $('#final-scoreboard').innerHTML = scoreRows(ranked);
  const doubtResults = state.doubtHistory.map((item, index) => `<article class="revealed-round"><div class="revealed-round-heading"><strong>Disputa ${index + 1}</strong><b class="duel-target">meta ${formatSeconds(item.target)}s</b></div><div class="revealed-result"><strong>${escapeHtml(item.doubter)}</strong><span>desafiou ${escapeHtml(item.challenged)}</span><b class="direction ${item.timePassed ? 'higher' : 'lower'}">${item.timePassed ? 'duvidou certo' : 'duvidou errado'}</b></div><div class="revealed-result"><strong>${escapeHtml(item.eliminated)}</strong><span>tempo pausado ${formatSeconds(item.elapsed)}s</span><b class="disqualified">desclassificado</b></div><div class="click-summary"><span>Tempos pausados</span>${item.pausedTimes.map((player) => `<b>${escapeHtml(player.name)}: ${player.times.length ? player.times.map((time) => `${formatSeconds(time)}s`).join(' → ') : 'não pausou'}</b>`).join('')}</div></article>`).join('');
  $('#revealed-rounds').innerHTML = state.format === 'doubt' ? `<p class="kicker">Disputas da partida</p>${doubtResults}` : `<p class="kicker">Resultado de cada rodada</p>${state.roundHistory.map((round, roundIndex) => `
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
  state.doubtHistory = [];
  state.lastPasser = null;
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
  $('#start-game').textContent = state.format === 'doubt' && state.players.length < 2 ? 'Adicione 2 jogadores' : state.players.length ? 'Começar jogo' : 'Adicione pelo menos 1 jogador';
}));
$('#start-game').addEventListener('click', startGame);
$('#timer-button').addEventListener('click', () => {
  if (state.format === 'doubt') {
    if (!state.running && !state.lastPasser && state.turn === 0) return startDoubtTimer();
    return state.lastPasser ? continueDoubtTurn() : passDoubtTurn();
  }
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
$('#doubt-button').addEventListener('click', () => {
  resolveDoubt();
});
$('#next-turn').addEventListener('click', () => {
  if (state.format === 'doubt') {
    if (state.activePlayers.length === 1) showFinal();
    else { state.round += 1; startDoubtRound(); }
    return;
  }
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
