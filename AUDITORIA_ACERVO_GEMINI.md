# 🏎️ Relatório de Auditoria do Acervo — Garagem em Miniatura
**Data:** 22/10/2026, 17:25:36  
**Curadoria:** PereiraLabs (Louzada & Pereira - Soluções Digitais)  
**Arquivo de Dados:** `src/data/ia_reports/audit_results.json`  
---
## 📊 Resumo Executivo
- **Total de Veículos no Catálogo (`cars.ts`):** 105
- **Total de Fotos Físicas em `public/img/`:** 75
- **Veículos com Fotos Existentes:** 75
- **Veículos Aguardando Fotos:** 30
- **Miniaturas com Nomenclatura Genérica ("Modelo a Identificar"):** 5
---
## 🔍 1. Miniaturas com Foto Física que Precisam de Identificação
As fotos físicas existem em `public/img/`, mas estão cadastradas como modelos genéricos no catálogo:
| ID | Foto | Nome Atual no Catálogo | Ação Recomendada |
|:---|:-----|:-----------------------|:------------------|
| #25 | `public/img/25.jpg` | #25 Van Modelo a Identificar (—) | Rodar com Gemini Vision ou classificar via Modo Curador |
| #35 | `public/img/35.jpg` | #35 Calhambeque Modelo a Identificar (1929) | Rodar com Gemini Vision ou classificar via Modo Curador |
| #52 | `public/img/52.jpg` | #52 BMW Modelo a Identificar (—) | Rodar com Gemini Vision ou classificar via Modo Curador |
| #56 | `public/img/56.jpg` | #56 Koenigsegg Modelo a Identificar (—) | Rodar com Gemini Vision ou classificar via Modo Curador |
| #84 | `public/img/84.jpg` | #84 Cadillac Modelo a Identificar (1953) | Rodar com Gemini Vision ou classificar via Modo Curador |
---
## 📸 2. Veículos no Catálogo Aguardando Foto Física (30)
Estes modelos estão cadastrados no acervo, mas não possuem arquivo `.jpg` correspondente em `public/img/` (utilizam o logo padrão temporário):
| ID | Veículo | Categoria | Fabricante |
|:---|:--------|:----------|:-----------|
| #3 | Gurgel Itaipu E-400 Telerj Rio de Janeiro Cpt (1976) | Nacional | Welly |
| #17 | Porsche 911 GT3 (—) | Esportivo | — |
| #29 | Camburão Viatura Policial (—) | Viatura / Serviço | — |
| #30 | Auto Clássico Modelo a Identificar (—) | Clássico | — |
| #31 | Ford Ka (1996) | Nacional | — |
| #32 | Mercedes-Benz E63 AMG (—) | Esportivo | — |
| #34 | Ford Fairlane 500 Skyliner (1957) | Clássico | — |
| #44 | Hyundai Tucson (2018) | Utilitário | — |
| #47 | Mitsubishi Pajero (—) | Utilitário | — |
| #49 | Renault Clio RS (2013) | Esportivo | — |
| #53 | Táxi de Londres (2006) | Viatura / Serviço | — |
| #57 | Lamborghini Modelo a Identificar (—) | Esportivo | — |
| #58 | Chevrolet Opala (—) | Nacional | — |
| #59 | Dodge Charger (—) | Muscle Car | — |
| #64 | Mercedes-Benz 300S (—) | Clássico | — |
| #73 | Mercedes-AMG GT (—) | Esportivo | — |
| #76 | Mercedes-Benz Classe SLK (—) | Esportivo | — |
| #81 | Land Rover Defender (—) | Utilitário | — |
| #87 | Ford Mustang GT (2006) | Muscle Car | — |
| #91 | Mercedes-Benz 350 (—) | Clássico | — |
| #92 | BMW Modelo a Identificar (—) | Esportivo | — |
| #95 | Chevrolet El Camino (1965) | Utilitário | — |
| #96 | Dodge Charger (—) | Muscle Car | — |
| #97 | Chevrolet Impala SS (1964) | Muscle Car | — |
| #98 | Dodge Ram 1500 (2019) | Utilitário | — |
| #100 | Renault Gordini (1965) | Nacional | — |
| #101 | Ford Picape (1932) | Utilitário | — |
| #102 | Ford Mustang (1964) | Muscle Car | — |
| #104 | Porsche 911 GT3 RS (—) | Esportivo | — |
| #105 | McLaren Senna (—) | Esportivo | — |
---
## 🛠️ Como Executar a Auditoria Visual Completa com Gemini
Para enviar todas as fotos físicas para identificação automatizada no Google Gemini Vision:
```bash
node scripts/audit_collection.mjs --key=SUA_CHAVE_GEMINI_AQUI
```
Os resultados serão atualizados automaticamente em `src/data/ia_reports/audit_results.json` e exibidos na aba de Curadoria dentro do aplicativo.