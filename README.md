# 🏎️ Garagem em Miniatura - Controlador da Aplicação (v2.7.0)

> Progressive Web App (PWA) e App Multiplataforma Nativo (**Android** + **iOS**) com arquitetura **Live Over-The-Air (OTA)** para catalogação, preservação histórica, filtragem inteligente e curadoria visual com Inteligência Artificial para réplicas automotivas em miniatura.

Desenvolvido por **PereiraLabs (Divisão de Tecnologia e IA da Louzada & Pereira - Soluções Digitais)**.  
Hospedagem Oficial em Produção: [andreweua.github.io/garagem-miniatura/](https://andreweua.github.io/garagem-miniatura/)  
Repositório Oficial: [github.com/andreweua/garagem-miniatura](https://github.com/andreweua/garagem-miniatura)

---

## 📌 Sobre o Projeto

A **Garagem em Miniatura** é uma plataforma concebida para digitalizar, organizar e preservar um acervo particular de 105 modelos automotivos em miniatura catalogados a partir de registros manuscritos históricos. O sistema opera como um aplicativo instalável de alto desempenho (PWA e nativo via Capacitor 7 para Android e iPhone), oferecendo busca em tempo real, visualização em alta definição, suporte offline completo e curadoria assistida por IA via Google Gemini (`gemini-3.8-flash` via `@google/genai` Interactions API).

---

## 🚀 Principais Recursos

* **Catálogo dos 105 Veículos:** Base estruturada em `src/data/cars.ts` com categorias (Clássicos, Nacionais, Esportivos, Muscle Cars, Utilitários e Viaturas/Serviço), suportando escala (`📏 1:64`, `1:43`, etc.), preço de compra e história oficial nativa.
* **Apps Nativos Android & iOS:** Suporte nativo completo via Capacitor 7 (`com.garagemminiatura.app`), com ícones originais 100% preservados, permissões de câmera/armazenamento e compilação automatizada na nuvem via GitHub Actions.
* **Live Over-The-Air (OTA) Updates:** O aplicativo nativo sincroniza dinamicamente com a versão web em nuvem mantendo cache offline local (Workbox). Toda alteração no catálogo, fotos ou histórias atualiza no celular dos usuários pelo ar, sem necessidade de baixar um novo APK.
* **IA Scanner Sob Demanda (`gemini-3.8-flash`):** Reconhece a foto da miniatura, analisa o histórico automotivo do modelo real e verifica automaticamente se o modelo já pertence ao acervo ou se é uma *"Sugestão de Próxima Compra para o Acervo"*.
* **Clean UI & Formatação com ReactMarkdown:** Trata a resposta da IA, remove blocos de código brutos e transforma referências como `#1 . Mercedes-Benz 500SL` em links interativos que rolam a tela e abrem o card do veículo.
* **Prevenção de Duplicidade nos Cards:** O modal exibe apenas a visualização limpa e formatada (`ReactMarkdown`), com botão alternável de edição manual caso o usuário queira customizar o texto.
* **Histórico Editável & Exportação:** Permite salvar histórias personalizadas por miniatura com persistência local e exportar relatórios compilados em `.txt` e `.json` para análise do desenvolvedor.
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
* **Canal 1 — Google Workspace / Google Drive:** Integração via Google Apps Script Web App (`WORKSPACE_APPS_SCRIPT_URL`). Salva a foto `.jpg` e o relatório `.json`/`.txt` diretamente em uma pasta do Google Drive (`Garagem_Miniatura_IA_Reports`) e envia alerta com anexo da foto para o e-mail do curador.
* **Canal 2 — Webhook do n8n:** Envio de payload estruturado via `POST` (`N8N_WEBHOOK_URL`) para automações e notificações no WhatsApp/Telegram.
* **Canal 3 — GitHub API Direto:** Gravação direta de relatórios em `src/data/ia_reports/` e fotos em `src/data/ia_reports/img/` no repositório `andreweua/garagem-miniatura`.

> 💡 **Sincronização Retroativa:** Ao abrir o aplicativo, o sistema varre o armazenamento local (`localStorage`) e despacha automaticamente relatórios e histórias pendentes para a nuvem. O usuário também dispõe do botão manual `☁️ Sincronizar Relatórios Pendentes com Google Drive` nas Configurações.

---

## 🔒 Conformidade de Privacidade (Google Play, Apple App Store e LGPD)

Para evitar questionamentos ou recusas em revisões das lojas de aplicativos:

1. **Consentimento Ativo & Transparente:** O usuário possui controle claro no Scanner IA e nas Configurações com a opção:
   > `☑️ Contribuir com o Acervo PereiraLabs: Autorizo o envio da foto da miniatura (com remoção automática de GPS/EXIF) e da análise técnica para curadoria e atualização do catálogo.`
2. **EXIF/GPS Strip:** Nenhuma coordenada geográfica, identificador de dispositivo ou foto pessoal externa é transmitida.
3. **Política de Privacidade Integrada:** Disponível na seção "Sobre o Projeto" do aplicativo, descrevendo a finalidade exclusivamente técnica e voluntária da curadoria de miniaturas.
4. **Permissões Nativas Declaradas:**
   - **Android:** `CAMERA`, `INTERNET` no `AndroidManifest.xml`.
   - **iOS:** `NSCameraUsageDescription` e `NSPhotoLibraryUsageDescription` no `Info.plist`.

---

## 🤖 Compilação Automatizada na Nuvem (CI/CD GitHub Actions)

O repositório possui esteiras de integração contínua que compilam automaticamente todas as plataformas a cada push na branch `main`:

* **PWA (GitHub Pages):** `.github/workflows/deploy.yml` — Constrói e publica o site estático com Service Worker em ~45 segundos.
* **Android APK:** `.github/workflows/build-apk.yml` — Executa no Ubuntu com JDK 21 e Gradle 8.11.1, gerando o arquivo `app-debug.apk` pronto para download na aba **Actions ➔ Artifacts**.
* **iOS App:** `.github/workflows/build-ios.yml` — Executa em servidores virtuais Mac (`macos-14` Apple Silicon) com CocoaPods e Xcode, gerando o bundle `App.app`.

---

## 📂 Estrutura de Diretórios

```text
colecao-carrinhos/
├── .agents/
│   └── skills/
│       └── curadoria-acervo-garagem/
│           └── SKILL.md            # Skill oficial Antigravity para curadoria e alinhamento do acervo
├── .github/workflows/
│   ├── deploy.yml                  # Pipeline CI/CD GitHub Pages
│   ├── build-apk.yml               # Pipeline CI/CD Android APK (JDK 21 + Gradle 8.11.1)
│   └── build-ios.yml               # Pipeline CI/CD iOS App (Xcode + macOS-14)
├── android/                        # Projeto nativo Android (Capacitor 7)
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml # Permissões de câmera e configurações do app
│   │   │   └── res/                # Ícones adaptativos em todas as densidades mipmap
│   │   └── build.gradle            # Configuração do módulo Android (API 35, Java 21)
│   └── build.gradle                # Configuração raiz Gradle
├── ios/                            # Projeto nativo iOS (Capacitor 7)
│   └── App/
│       ├── App.xcworkspace         # Workspace oficial do Xcode
│       └── App/
│           ├── Info.plist          # Permissões da Apple (Câmera e Fotos)
│           └── Assets.xcassets/    # AppIcon oficial universal (1024x1024)
├── public/
│   ├── favicon.ico
│   ├── pwa-192x192.png
│   ├── pwa-512x512.png
│   └── img/                        # Acervo de fotos originais dos carrinhos
├── src/
│   ├── config/
│   │   └── curatorEndpoints.ts     # Configuração centralizada dos canais de interceptação em código
│   ├── data/
│   │   ├── cars.ts                 # Catálogo dos 105 veículos com campo nativo historia
│   │   └── ia_reports/             # Relatórios gerados pela IA (.json, .txt e /img/)
│   ├── types/
│   │   └── car.ts                  # Tipagens TypeScript (CarItem, Stories, Reactions, IaReportEntry)
│   ├── App.tsx                     # Componente central com busca, modais e scanner IA
│   ├── App.css                     # Estilos com Glassmorphism, temas claro/escuro e Clean Markdown
│   └── main.tsx                    # Ponto de entrada React 19
├── capacitor.config.ts             # Configuração Capacitor com Live Over-The-Air (OTA)
├── vite.config.ts                  # Vite + React + PWA + middleware local ia-reports-writer
├── package.json                    # Dependências e versão da aplicação (v2.7.0)
└── README.md                       # Documentação técnica e guia do curador
```

---

## 🛠️ Como Executar e Compilar Localmente

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor de desenvolvimento (com gravação física em src/data/ia_reports/)
npm run dev

# 3. Compilar versão web para produção
npm run build

# 4. Sincronizar alterações com as plataformas nativas (Android e iOS)
npm run cap:sync

# 5. Sincronizar especificamente o Android
npm run build:apk

# 6. Sincronizar especificamente o iOS
npm run build:ios
```

---

## 📝 Histórico de Versões

* **v2.7.0:** Inicialização da plataforma nativa **iOS** (`ios/App.xcworkspace`, `Info.plist` com autorizações da Apple e `AppIcon` 1024x1024 preservado), esteira CI/CD em servidores Mac virtuais (`build-ios.yml`), e ativação da arquitetura **Live Over-The-Air (OTA)** para atualização contínua pelo ar via GitHub Pages.
* **v2.6.0:** Inicialização da plataforma nativa **Android** via Capacitor 7, preservação de 100% dos ícones originais (todas as densidades mipmap), permissões de câmera/galeria no `AndroidManifest.xml` e pipeline CI/CD no GitHub Actions (`build-apk.yml`) compilando `.apk` automaticamente com JDK 21 e Gradle 8.11.1.
* **v2.5.4:** Campo `historia` nativo no catálogo `src/data/cars.ts`, permitindo fixar as histórias da IA diretamente no banco de dados para todos os usuários sem depender de armazenamento local.
* **v2.5.3:** Conexão oficial do Webhook do Google Apps Script com envio de e-mail e fotos anexadas, além da rotina de auto-sincronização retroativa de relatórios pendentes.
* **v2.5.2:** Criação da Skill oficial do Antigravity `.agents/skills/curadoria-acervo-garagem/SKILL.md` com guia passo a passo para auditoria e alinhamento de fotos e nomes do acervo.
* **v2.5.1:** Adicionados campos opcionais `escala` (com badge 📏 no card) e `precoCompra` (destaque verde no modal).
* **v2.5.0:** Documentação técnica completa das rotas de interceptação, conformidade com políticas de privacidade de lojas e consolidação dos canais de curadoria em código.
* **v2.4.9:** Movidos os endpoints de interceptação de nuvem (Google Drive, n8n, GitHub) para o código em `src/config/curatorEndpoints.ts`, limpando a interface de configurações para o usuário final.
* **v2.4.8:** Implementada compressão de imagem com remoção de metadados EXIF/GPS via Canvas, consentimento transparente de curadoria e seção de Política de Privacidade (LGPD / Google Play / App Store).
* **v2.4.7:** Correção do versionamento dinâmico no cabeçalho, aba Sobre e rodapé institucional.
* **v2.4.6:** Clean UI com `react-markdown`, salvamento automático em `src/data/ia_reports/` e Inteligência de Vínculo de Coleção (Card do Veículo vs. Sugestão de Próxima Compra).
