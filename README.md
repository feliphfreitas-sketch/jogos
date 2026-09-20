# Acerte o Tempo

Jogo offline de precisão para jogar sozinho ou passar o celular entre amigos. O alvo é sorteado automaticamente entre `00.00` e `12.00` segundos. A meta fica visível, mas o cronômetro correndo fica escondido.

## Regras

- Cadastre de 1 a 6 jogadores.
- Escolha entre `1 rodada`, `Até sobrar 1` ou `Duvido`.
- Em cada rodada, o jogo sorteia uma meta com `Math.random()` e mostra o alvo ao jogador.
- A ordem dos jogadores é sorteada aleatoriamente no início de cada rodada (ou disputa).
- Cada jogador vê a meta, toca em **Começar** e depois em **Parar** quando achar que chegou ao alvo.
- O resultado mostra o tempo parado e sinaliza `↓ menor` ou `↑ maior` que a meta.
- No modo de uma rodada, não há pontos: vence quem ficar mais perto da meta.
- No modo eliminatório, o jogador mais distante da meta sai a cada rodada, até restar o campeão.
- No modo `Duvido`, o tempo corre escondido e passa de pessoa em pessoa. Quem recebe o celular pode retomar e pausar novamente ou desafiar a pessoa anterior. Se o tempo passou da meta, sai quem pausou; se ainda não passou, sai quem duvidou. Acertar exatamente a meta ainda não conta como passar.
- Ao final, o jogo revela os alvos, os palpites e o campeão.

## Como jogar

Abra o arquivo `index.html` no navegador. Não é necessário instalar dependências ou iniciar um servidor.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub.
2. Envie `index.html`, `style.css`, `script.js` e `README.md` para a branch principal.
3. Em **Settings > Pages**, selecione a branch principal e a pasta `/root`.
4. Salve para gerar o link público do jogo.

O projeto não usa banco de dados nem depende de internet.

## Critério de vitória

Não há pontos. A diferença absoluta entre o realizado e a meta define a classificação. Quanto menor a diferença, melhor a posição. No modo de uma rodada, o último é desclassificado; no modo eliminatório, o último sai a cada rodada.
