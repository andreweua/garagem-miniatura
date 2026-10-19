# 🏎️ Garagem em Miniatura - Controlador da Aplicação (v2.5.0)

> Progressive Web App (PWA) e App Multiplataforma (Capacitor) para catalogação, preservação histórica, filtragem inteligente e curadoria visual com Inteligência Artificial para réplicas automotivas em miniatura.

Desenvolvido por **PereiraLabs (Divisão de Tecnologia e IA da Louzada & Pereira - Soluções Digitais)**.  
Hospedagem Oficial em Produção: [andreweua.github.io/garagem-miniatura/](https://andreweua.github.io/garagem-miniatura/)  
Repositório Oficial: [github.com/andreweua/garagem-miniatura](https://github.com/andreweua/garagem-miniatura)

---

## 📌 Sobre o Projeto

A **Garagem em Miniatura** é uma plataforma concebida para digitalizar, organizar e preservar um acervo particular de 105 modelos automotivos em miniatura catalogados a partir de registros manuscritos históricos. O sistema opera como um aplicativo instalável de alto desempenho (PWA e nativo via Capacitor), oferecendo busca em tempo real, visualização em alta definição, suporte offline completo e curadoria assistida por IA via Google Gemini (`gemini-3.8-flash` via `@google/genai` Interactions API).

---

## 🚀 Principais Recursos

* **Catálogo dos 105 Veículos:** Base estruturada em `src/data/cars.ts` com categorias (Clássicos, Nacionais, Esportivos, Muscle Cars, Utilitários e Viaturas/Serviço).
* **IA Scanner Sob Demanda (`gemini-3.8-flash`):** Reconhece a foto da miniatura, analisa o histórico automotivo do modelo real e verifica automaticamente se o modelo já pertence ao acervo ou se é uma *"Sugestão de Próxima Compra para o Acervo"*.
* **Clean UI & Formatação com ReactMarkdown:** Trata a resposta da IA, remove blocos de código brutos e transforma referências como `#1 . Mercedes-Benz 500SL` em links interativos que rolam a tela e abrem o card do veículo.
* **Prevenção de Duplicidade nos Cards:** O modal exibe apenas a visualização limpa e formatada (`ReactMarkdown`), com botão alternável de edição manual caso o usuário queira customizar o texto.
* **Histórico Editável & Exportação:** Permite salvar histórias personalizadas por miniatura com persistência local e exportar relatórios compilados em `.txt` e `.json` para análise do desenvolvedor.
* **PWA & Mobile-First com Capacitor:** Totalmente instalável no Android e iOS (`com.garagemminiatura.app`), com manifesto PWA, service worker Workbox e suporte offline.
* **Tema Claro & Escuro:** Alternância de tema com persistência no `localStorage`.

---

## 📡 Arquitetura de Interceptação e Curadoria em 2º Plano

Para garantir que análises feitas em celulares ou computadores remotos possam ser enviadas para curadoria central sem depender de digitação manual de endpoints pelo usuário, a aplicação possui um **mecanismo de interceptação em código** centralizado em `src/config/curatorEndpoints.ts`.

### O que é interceptado no momento da análise?
1. **Foto Comprimida em Base64:** Redimensionada para no máximo 800px em JPEG (~50–80 KB) via `<canvas>`.
2. **Remoção de Metadados EXIF/GPS:** O redesenho em memória descarta automaticamente metadados de localização e dispositivo, garantindo total privacidade do usuário.
3. **Relatório Técnico Formatado:** Análise completa da IA estruturada em `.json` e `.txt`.
4. **Vínculo do Catálogo:** Identificador do veículo ou recomendação de nova aquisição.

### Os 3 Canais de Envio (Configurados no Código):
* **Canal 1 — Google Workspace / Google Drive:** Integração via Google Apps Script Web App (`WORKSPACE_APPS_SCRIPT_URL`). Salva a foto `.jpg` e o relatório `.json`/`.txt` diretamente em uma pasta do Google Drive (`Garagem_Miniatura_IA_Reports`).
* **Canal 2 — Webhook do n8n:** Envio de payload estruturado via `POST` (`N8N_WEBHOOK_URL`) para automações e notificações no WhatsApp/Telegram.
* **Canal 3 — GitHub API Direto:** Gravação direta de relatórios em `src/data/ia_reports/` e fotos em `src/data/ia_reports/img/` no repositório `andreweua/garagem-miniatura`.

> 💡 **Nota de Segurança:** O arquivo `src/config/curatorEndpoints.ts` lê variáveis de ambiente `VITE_WORKSPACE_WEBHOOK_URL`, `VITE_N8N_WEBHOOK_URL` e `VITE_GITHUB_SYNC_TOKEN`. Nunca exponha tokens com permissão de escrita diretamente em texto puro no GitHub público para evitar revogação automática por Secret Scanning.

---

## 🔒 Conformidade de Privacidade (Google Play, Apple App Store e LGPD)

Para evitar questionamentos ou recusas em revisões das lojas de aplicativos:

1. **Consentimento Ativo & Transparente:** O usuário possui controle claro no Scanner IA e nas Configurações com a opção:
   > `☑️ Contribuir com o Acervo PereiraLabs: Autorizo o envio da foto da miniatura (com remoção automática de GPS/EXIF) e da análise técnica para curadoria e atualização do catálogo.`
2. **EXIF/GPS Strip:** Nenhuma coordenada geográfica, identificador de dispositivo ou foto pessoal externa é transmitida.
3. **Política de Privacidade Integrada:** Disponível na seção "Sobre o Projeto" do aplicativo, descrevendo a finalidade exclusivamente técnica e voluntária da curadoria de miniaturas.

---

## 📂 Estrutura de Diretórios

```text
colecao-carrinhos/
├── .github/workflows/
│   └── deploy.yml            # Pipeline CI/CD GitHub Pages via GitHub Actions
├── public/
│   ├── favicon.ico
│   ├── pwa-192x192.png
│   ├── pwa-512x512.png
│   └── img/                  # Acervo de fotos originais dos carrinhos (ex: 1.jpg ... 88.jpg)
├── src/
│   ├── config/
│   │   └── curatorEndpoints.ts # Configuração centralizada dos canais de interceptação em código
│   ├── data/
│   │   ├── cars.ts           # Catálogo dos 105 veículos
│   │   └── ia_reports/       # Relatórios gerados pela IA (.json, .txt e /img/)
│   ├── types/
│   │   └── car.ts            # Tipagens TypeScript (CarItem, Stories, Reactions, IaReportEntry)
│   ├── App.tsx               # Componente central com busca, modais e scanner IA
│   ├── App.css               # Estilos com Glassmorphism, temas claro/escuro e Clean Markdown
│   └── main.tsx              # Ponto de entrada React 19
├── capacitor.config.ts       # Configuração Capacitor (com.garagemminiatura.app)
├── vite.config.ts            # Vite + React + PWA + middleware local ia-reports-writer
├── package.json              # Dependências e versão da aplicação (v2.5.0)
└── README.md                 # Documentação técnica e guia do curador
```

---

## 🛠️ Como Executar Localmente

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor de desenvolvimento (com gravação física em src/data/ia_reports/)
npm run dev

# 3. Compilar versão de produção
npm run build

# 4. Sincronizar com plataformas nativas (Capacitor)
npx cap sync
```

---

## 📝 Histórico de Versões Recentes

* **v2.5.0:** Documentação técnica completa das rotas de interceptação, conformidade com políticas de privacidade de lojas e consolidação dos canais de curadoria em código.
* **v2.4.9:** Movidos os endpoints de interceptação de nuvem (Google Drive, n8n, GitHub) para o código em `src/config/curatorEndpoints.ts`, limpando a interface de configurações para o usuário final.
* **v2.4.8:** Implementada compressão de imagem com remoção de metadados EXIF/GPS via Canvas, consentimento transparente de curadoria e seção de Política de Privacidade (LGPD / Google Play / App Store).
* **v2.4.7:** Correção do versionamento dinâmico no cabeçalho, aba Sobre e rodapé institucional.
* **v2.4.6:** Clean UI com `react-markdown`, salvamento automático em `src/data/ia_reports/` e Inteligência de Vínculo de Coleção (Card do Veículo vs. Sugestão de Próxima Compra).