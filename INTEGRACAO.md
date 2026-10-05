# Integração com a linguagem Tom

Este repositório contém o jogo Bastião. Compilador, biblioteca padrão, runtime,
toolchain e recibos de validação ficam em
[LinguagemTom](https://github.com/FamiliaEstudio/LinguagemTom). Scripts e testes
do jogo pressupõem sua localização em `jogos/fps-tom/` nessa árvore.

A versão publicada em 2026-10-05 já está integrada à linguagem e inclui os
backends SDL e GPU. Use uma versão de LinguagemTom que contenha
`tom-lang/bootstrap/RETOMADA.md` e o plano de autonomia gráfica. O antigo
`tom-fps.patch`, preservado no repositório separado como histórico do raycaster,
não deve ser aplicado sobre essa versão.

O caminho direto é clonar LinguagemTom: a pasta do jogo já está incluída.

```sh
git clone https://github.com/FamiliaEstudio/LinguagemTom.git
cd LinguagemTom
```

Para trabalhar também com o repositório separado `fps-tom`, mantenha o clone
como irmão e sincronize seus arquivos versionados para `jogos/fps-tom/`, sem
copiar `.git`, builds ou toolchains. Preserve alterações locais antes de copiar.
Não edite as duas cópias em paralelo sem reconciliá-las.

Prepare as ferramentas conforme `scripts/README.md` da linguagem e ative
`scripts/env.sh` ou `scripts/env.ps1`. Execute os comandos de preparação,
build e testes do [README do jogo](README.md) a partir da raiz de LinguagemTom.
O estado e as limitações da implementação da linguagem ficam em
[RETOMADA.md](https://github.com/FamiliaEstudio/LinguagemTom/blob/main/tom-lang/bootstrap/RETOMADA.md).
O plano está pausado; a publicação registra progresso e não conclui GA007/C1/C2.
