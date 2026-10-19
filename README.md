# 🏎️ Garagem em Miniatura - Controlador da Aplicação

> Progressive Web App (PWA) para catalogação, preservação histórica, filtragem inteligente e curadoria visual com inteligência artificial para réplicas automotivas em miniatura.

Desenvolvido por **PereiraLabs (divisão da Louzada & Pereira - Soluções Digitais)**.  
Hospedagem Oficial em Produção: [andreweua.github.io/colecao-carrinhos/](https://andreweua.github.io/colecao-carrinhos/)

---

## 📌 Sobre o Projeto

A **Garagem em Miniatura** é uma plataforma concebida para digitalizar e organizar um acervo particular de 105 modelos catalogados a partir de registros manuscritos históricos. O sistema opera como um aplicativo instalável de alto desempenho (PWA), oferecendo busca em tempo real, visualização em alta definição e comparação visual via Google Gemini Vision API (`gemini-3.8-flash`) para evitar duplicidades em novas aquisições.

---

## 🚀 Principais Recursos

* **Estrutura Modular e Desacoplada:** Banco de dados isolado em `data.js`, permitindo adições simples sem alterações de código-fonte.
* **Fallback Visual Oficial:** Miniaturas sem foto cadastrada exibem automaticamente o selo oficial circular `GaragemMini` (`img/icon-192.png`).
* **Modal de Detalhes:** Exibição expandida das especificações do veículo, histórico e foto em alta resolução.
* **IA Scanner Sob Demanda:** Card métrico no topo (`🤖 IA`) que abre o comparador de imagem conectado diretamente ao modelo `gemini-3.8-flash`.
* **PWA & Mobile-First:** Totalmente instalável no Android e iOS, com manifesto (`manifest.json`), service worker e suporte offline.
* **Canal Social via WhatsApp:** Mecanismo de curadoria com envio pré-formatado de dúvidas e comentários para o curador (`+55 35 99234-4229`).

---

## 📂 Arquitetura do Repositório

```text
colecao-carrinhos/
├── index.html        # Estrutura semântica v6.2.0 com cabeçalho fixo e modais
├── style.css         # Folha de estilos responsiva com tema escuro e glassmorphism
├── script.js         # Controlador da aplicação, busca, filtros e IA Vision
├── data.js           # Base de dados pura com o catálogo dos 105 veículos
├── manifest.json     # Manifesto PWA com declaração de ícones e temas
├── sw.js             # Service Worker para controle de cache
├── img/              # Acervo fotográfico e ícones (32, 64, 180, 192 e 512px)
├── CHANGELOG.md      # Histórico oficial de versões
└── README.md         # Documentação institucional do projeto