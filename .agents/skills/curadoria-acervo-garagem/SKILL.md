---
name: curadoria-acervo-garagem
description: >-
  Guia operacional de curadoria e correção do acervo de miniaturas da Garagem em Miniatura
  (PereiraLabs). Use para auditar fotos e nomes divergentes, parear fotos em public/img/,
  atualizar src/data/cars.ts, e incorporar relatórios da IA e novas aquisições.
---

# 🏎️ Skill de Curadoria do Acervo - Garagem em Miniatura

Esta skill estabelece o fluxo de trabalho passo a passo para corrigir nomes e fotos divergentes, validar miniaturas e incorporar relatórios gerados pela IA no catálogo oficial do projeto.

---

## 🔍 Diagnóstico do Estado Atual do Acervo

1. **Total de Veículos no Catálogo:** 105 veículos em `src/data/cars.ts`.
2. **Total de Fotos Físicas Disponíveis:** 75 arquivos `.jpg` em `public/img/`.
3. **Causa das Divergências:**
   - Alguns arquivos em `public/img/{id}.jpg` foram fotografados fora da ordem dos números manuscritos originais.
   - Há modelos cadastrados como `"Modelo a Identificar"` (ex.: #25, #30, #35, #41, #48, #53, etc.).
   - Modelos sem foto cadastrada atualmente usam o fallback para o selo `img/logo-garagem.png`.

---

## 📋 Como vamos corrigir (Fluxo de 3 Etapas)

### Etapa 1: Auditoria Visual das Fotos Existentes (`public/img/`)
- Mapear os 75 arquivos existentes em `public/img/` confrontando com a tabela em `src/data/cars.ts`.
- O que você (Andrew) pode fazer:
  - Conferir se a foto `public/img/X.jpg` corresponde de fato ao carro `#X` do catálogo.
  - Para as que estiverem invertidas ou trocadas, basta listar no chat:
    > *"A foto 14.jpg na verdade é do carro #18 (Lamborghini Veneno) e a 18.jpg é do Bel Air #14."*
  - A IA renomeia os arquivos e corrige as referências instantaneamente.

### Etapa 2: Correção dos Nomes e "Modelos a Identificar"
- Para os modelos que estão com nome genérico (`"Modelo a Identificar"`):
  - **Opção A (Via IA Scanner):** Aponte a câmera do celular para a miniatura no app e clique em **Analisar com IA**. O modelo `gemini-3.8-flash` identifica marca, modelo e ano aproximado. O relatório gerado fica gravado em `src/data/ia_reports/`.
  - **Opção B (Pelo Chat):** Você digita aqui:
    > *"Carro #25: Marca Ford, Modelo Transit Van 2012, Escala 1:43."*
  - A IA atualiza diretamente o item no `src/data/cars.ts`.

### Etapa 3: Preenchimento de Escalas e Preços de Compra (Novo na v2.5.1)
- Cada item no catálogo aceita agora os campos opcionais:
  - `escala`: ex.: `"1:18"`, `"1:43"`, `"1:64"` (adiciona a tag com ícone `📏` no card).
  - `precoCompra`: ex.: `"R$ 80,00"`, `"R$ 150,00"` (aparece no modal de detalhes em verde).

---

## ⚡ Checklist de Ações que Você Precisa Fazer em Breve

- [ ] **1. Identificar as fotos trocadas:** Olhar no app (ou na pasta `public/img`) quais miniaturas estão com a imagem errada e mandar os números no chat.
- [ ] **2. Escanear ou listar os "Modelos a Identificar":** Passar no IA Scanner do app os carrinhos sem nome para gerar a ficha técnica.
- [ ] **3. Adicionar Escala e Preço nos favoritos:** Informar as escalas das miniaturas principais para enriquecer o card.
- [ ] **4. Conectar o Google Drive ou n8n (Opcional):** Colar a URL do Webhook em `src/config/curatorEndpoints.ts` para que todas as fotos e relatórios futuros caiam direto na sua nuvem.
