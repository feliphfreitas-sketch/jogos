# Pare o Tempo

Jogo offline de precisão para jogar sozinho ou passar o celular entre amigos. O alvo é sorteado automaticamente entre `00.00` e `12.00` segundos. A meta e o cronômetro ficam visíveis para cada jogador tentar acertar.

## Regras

- Cadastre de 1 a 6 jogadores.
- Escolha 1, 3 ou 5 rodadas por jogador.
- Em cada rodada, o jogo sorteia uma meta secreta com `Math.random()`.
- Cada jogador vê a meta, toca em **Começar** e depois em **Parar** quando achar que chegou ao alvo.
- O resultado mostra o tempo parado e sinaliza `↓ menor` ou `↑ maior` que a meta.
- A pontuação é maior para quem fica mais perto da meta.
- Ao final, o jogo revela os alvos, os palpites e o campeão.

## Como jogar

Abra o arquivo `index.html` no navegador. Não é necessário instalar dependências ou iniciar um servidor.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub.
2. Envie `index.html`, `style.css`, `script.js` e `README.md` para a branch principal.
3. Em **Settings > Pages**, selecione a branch principal e a pasta `/root`.
4. Salve para gerar o link público do jogo.

O projeto não usa banco de dados nem depende de internet.
