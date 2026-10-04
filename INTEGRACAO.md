# Integração com a linguagem Tom

Este repositório guarda o código e os recursos do Bastião. O compilador, a biblioteca
padrão, o runtime e a toolchain estão em [LinguagemTom](https://github.com/FamiliaEstudio/LinguagemTom).
Os caminhos atuais dos scripts e testes pressupõem o jogo em `jogos/fps-tom/` nessa árvore.

Até as APIs de PNG, desenho de regiões e mouse relativo entrarem na linguagem pública,
use o patch `tom-fps.patch`. Ele contém somente as alterações da linguagem necessárias
ao jogo e foi preparado para o commit `a8a52cf` de LinguagemTom.

Em Linux ou WSL, com Git instalado, clone os dois repositórios como irmãos:

```bash
git clone https://github.com/FamiliaEstudio/LinguagemTom.git
git clone https://github.com/FamiliaEstudio/fps-tom.git
cd LinguagemTom
git checkout a8a52cf
git apply --check ../fps-tom/tom-fps.patch
git apply ../fps-tom/tom-fps.patch
mkdir -p jogos/fps-tom
cp -R ../fps-tom/AGENTS.md ../fps-tom/README.md ../fps-tom/assets ../fps-tom/scripts ../fps-tom/src ../fps-tom/tests jogos/fps-tom/
```

No Windows, faça a mesma aplicação do patch com Git e copie os arquivos e pastas
listados para `jogos/fps-tom/`, sem copiar a pasta `.git`.

Prepare as ferramentas conforme `scripts/README.md` em LinguagemTom. Após ativar
`scripts/env.sh` ou `scripts/env.ps1`, execute na raiz de LinguagemTom:

```text
node tom-lang/tomc.js --run --assets jogos/fps-tom/assets jogos/fps-tom/src/fps-tom.tom
node --test --test-concurrency=1 jogos/fps-tom/tests/*.test.js
node jogos/fps-tom/scripts/build.js
```

Não edite as duas cópias do jogo em paralelo. Integre as alterações entre os
repositórios e valide a combinação antes de distribuir um pacote.
