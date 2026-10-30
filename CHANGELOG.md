# 📋 Registro de Mudanças (Changelog)

---

### 5. `CHANGELOG.md`

```markdown
# 📝 Histórico de Alterações (Changelog) - Garagem em Miniatura

Todas as alterações notáveis deste projeto serão documentadas neste arquivo, seguindo o padrão de versionamento semântico.

---

## [2.9.2] - 2026-10-30
### Corrigido
- **Atualização dos Modelos Gemini AI (Erro 404):** Substituição dos modelos descontinuados (`gemini-1.5-flash`, `gemini-2.5-flash`) pelos modelos oficiais vigentes da Google AI Studio (`gemini-3.5-flash-lite`, `gemini-3.5-flash`, `gemini-3-flash-preview` e `gemini-3.8-flash`), eliminando o erro 404 no Scanner e reduzindo o tempo de reconhecimento para ~1.2s.

---

## [5.3.0] - 2026-10-18
### Adicionado
- **4º Card Métrico de IA:** Adicionado o card interativo `🤖 IA Scanner` na barra de estatísticas do topo, permitindo abrir o modal de reconhecimento com um toque.
- **Modal Sobre o Projeto (Opção 1):** Janela modal com documentação técnica, história do acervo e créditos acessível via menu de navegação.
- **Accordion Retrátil no Rodapé (Opção 2):** Seção colapsável `<details>` com especificações técnicas e notas sem sobrecarregar a interface.
- **Emblema de Versão Fixo:** Tag `v5.3.0` anexada diretamente ao logotipo no cabeçalho fixo.

### Modificado
- Remoção de containers estáticos de IA na tela inicial, concentrando todo o fluxo de foto e chave da API em um modal flutuante limpo.

---

## [5.2.0] - 2026-10-18
### Modificado
- Implementado acionamento condicional (sob demanda) para exibição do leitor de IA e campo de chave de API.
- Correção de travamento de layout ao exibir mensagens longas de retorno da IA.

---

## [5.1.0] - 2026-10-18
### Modificado
- Atualização do endpoint da Google AI Studio para o modelo oficial **`gemini-3.8-flash`**, corrigindo a descontinuação do identificador legado.

---

## [5.0.0] - 2026-10-18
### Adicionado
- Integração da Google Gemini Vision API para envio e análise de imagens de carrinhos novos contra a lista de 105 veículos[cite: 3, 4, 5, 6].
- Persistência segura da chave de API no `localStorage` do dispositivo do usuário.

---

## [4.0.0] - 2026-10-17
### Corrigido
- Ajuste definitivo de viewport e eliminação de overflow lateral no Safari iOS e Chrome Android.
- Correção das proporções e limites de altura (`max-height`) da imagem no modal de detalhes.

---

## [3.0.0] - 2026-10-17
### Modificado
- Isolamento visual das imagens nos cards, realocando o ano de fabricação para o rodapé em formato discreto junto da categoria.
- Remoção do estilo azul nativo dos links de navegação.

---

## [2.0.0] - 2026-10-16
### Adicionado
- Sistema interativo de reações Like e Dislike com contadores independentes.
- Caixa de feedback com redirecionamento de texto e link do catálogo para WhatsApp.

---

## [1.0.0] - 2026-10-16
### Adicionado
- Catalogação inicial dos 105 modelos baseados nas folhas de anotações manuscritas[cite: 3, 4, 5, 6].
- Mecanismo de busca textual e filtros rápidos por categoria.

Todas as alterações notáveis deste projeto serão documentadas neste arquivo.

## [1.0.0] - 2026-10-17

### Adicionado
- **Interface Base:** Estrutura web completa com HTML5 e CSS3 moderno em tema escuro automotivo.
- **Base de Dados Transcrita:** Catálogo com mais de 70 modelos de veículos transcritos diretamente das anotações manuscritas (incluindo Ferrari, Ford, Dodge, Chevrolet, Porsche, clássicos nacionais e viaturas).
- **Mecanismo de Filtro e Busca:**
  - Busca instantânea por nome do modelo, montadora ou ano.
  - Filtros rápidos em botões estilo pill: *Clássicos*, *Nacionais*, *Esportivos*, *Muscle Cars*, *Utilitários* e *Viaturas & Serviços*.
- **Modal de Detalhes:** Janela interativa exibindo informações completas do veículo ao clicar em um card.
- **Estatísticas Automáticas:** Indicadores no topo contabilizando o número total de miniaturas e marcas catalogadas.
- **Deploy:** Configuração preparada para publicação imediata via GitHub Pages.

---

## [Planejado para as próximas versões]

### [1.1.0]
- [ ] Integração com as fotos reais de cada modelo.
- [ ] Adição do campo de escala da miniatura (ex.: 1:18, 1:24, 1:43).
- [ ] Filtro por fabricante da miniatura (Welly, Maisto, Sunnyside, etc.).
