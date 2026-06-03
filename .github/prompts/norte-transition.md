# DIRETRIZ ESTRUTÚRICA: TRANSIÇÃO COMPLETA PARA ECOSSISTEMA NORTE GLOBAL HUB

Você deve encerrar e arquivar definitivamente o escopo do projeto anterior (Totem Octadesk). Limpe o espaço de trabalho e reconfigure o ambiente local para iniciar a arquitetura modular da Norte Global Hub.

## 1. PURGA TOTAL DE RESQUÍCIOS ANTERIORES
- Remova ou mova para uma pasta de backup externa todos os assets de imagem e vetores antigos da Octadesk localizados em `/public/assets`.
- Limpe o histórico de estados e os caches locais executando:
```bash
  Remove-Item -Recurse -Force .next
  Remove-Item -Recurse -Force out
```

## 2. RECONFIGURAÇÃO DO TOKEN-MONITOR PARA MODULARIDADE

Atualize o arquivo `.github/prompts/token-monitor.md` com a nova premissa de desenvolvimento:

* O agente atuará estritamente em escopos isolados (módulos).
* É proibido ler contextos de múltiplos microsserviços ou sub-aplicações simultaneamente.
* Mantenha a regra estrita: sem comentários ou explicações redundantes no código gerado.

## 3. INICIALIZAÇÃO DA ESTRUTURA MONOREPO / MODULAR

* Prepare o diretório raiz para acomodar a estrutura seccionada do ecossistema, criando a pasta base `/apps` ou preparando os arquivos de configuração do ecossistema Norte.
