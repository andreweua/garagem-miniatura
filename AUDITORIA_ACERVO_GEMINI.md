# 🏎️ Relatório Completo de Auditoria Visual — Garagem em Miniatura
**Data de Execução:** 22/10/2026, 22:06:28  
**Motor de IA:** Google Gemini Multimodal Vision (Google AI Studio)  
**Curadoria:** PereiraLabs (Louzada & Pereira - Soluções Digitais)  
**Arquivo de Dados Estruturado:** `src/data/ia_reports/audit_results.json`  
---
## 📊 Resumo Executivo da Auditoria
- **Total de Modelos no Catálogo (`cars.ts`):** 105
- **Total de Fotos Físicas Auditadas (`public/img/`):** 75
- **Miniaturas com Identificação Confirmada (Batem com Catálogo):** 19 ✅
- **Modelos Genéricos Solucionados pela IA ("Modelo a Identificar"):** 5 🔍
- **Possíveis Divergências ou Ajustes Sugeridos pela IA:** 48 ⚠️
- **Modelos no Catálogo Aguardando Foto Física:** 30 📸
---
## 🔍 1. Modelos Genéricos Solucionados pelo Gemini Vision (5)
A IA inspecionou as miniaturas físicas e revelou os modelos reais que estavam cadastrados como genéricos:
| ID | Foto | Nome Antigo no Catálogo | Veículo Identificado pela IA | Detalhes Visuais Observados |
|:---|:-----|:------------------------|:-----------------------------|:----------------------------|
| **#25** | `public/img/25.jpg` | Van Modelo a Identificar | **Volkswagen Transporter T5 (Multivan/Caravelle) (2003-2009)** | Miniatura na cor branca, estilo customizado com rodas esportivas de cinco raios duplos, representação clara da frente da VW Transporter T5. O catálogo original estava como 'Modelo a Identificar'. |
| **#35** | `public/img/35.jpg` | Calhambeque Modelo a Identificar | **Trabant 601 (1964-1990)** | Miniatura de um Trabant 601 na cor azul claro, com rodas estilo aço estampado e para-choques pretos. O texto sobreposto na imagem está incorreto, pois o veículo não é um Ford Fairlane. |
| **#52** | `public/img/52.jpg` | BMW Modelo a Identificar | **Toyota Camry (2015)** | Miniatura na cor vermelho metálico, representando um Toyota Camry sedan de 2015, com teto solar, rodas prateadas estilo multiraios e acabamento em cromado nos detalhes frontais. |
| **#56** | `public/img/56.jpg` | Koenigsegg Modelo a Identificar | **Ford F-100 Pickup (1956)** | Miniatura na cor amarela, estilo picape clássica americana, rodas de plástico com calotas prateadas, para-choque cromado. A marca no catálogo estava incorretamente registrada como Koenigsegg. |
| **#84** | `public/img/84.jpg` | Cadillac Modelo a Identificar | **Toyota FJ Cruiser (2006)** | Miniatura na cor preta com teto branco, rodas de 6 raios prateadas, grade frontal característica com faróis redondos e inscrição Toyota. O catálogo estava incorretamente registrado como Cadillac. |
---
## ⚠️ 2. Possíveis Divergências / Ajustes Sugeridos (48)
Casos em que a miniatura física apresenta variações de versão, geração ou nome em relação ao catálogo:
| ID | Foto | Nome no Catálogo | Identificado na Foto pela IA | Observação |
|:---|:-----|:-----------------|:-----------------------------|:-----------|
| **#2** | `public/img/2.jpg` | Larven Modellauto Katalog | **Desconhecido Desconhecido** | {
  "identifiedBrand": "Peugeot",
  "identifiedModel": "505 Sedan",
  "identifiedYear": "1979",
  "isMatch": false,
  "details": "Miniatura die-cast da Majorette (No. 238) representando um Peugeot 505 Taxi 'Yellow Cab' na cor amarela. Apresenta marcas de uso e desgaste na pintura, portas dianteiras operacionais (que abrem), interior em plástico preto, decais nas laterais com a inscrição 'YELLOW CAB' e padrão xadrez preto e branco." |
| **#9** | `public/img/9.jpg` | Ford F1 | **Desconhecido Desconhecido** | {
  "identifiedBrand": "Ford",
  "identifiedModel": "F-1 Pickup",
  "identifiedYear": "1948",
  "isMatch": true,
  "details": "Miniatura em tom cinza-azulado fosco (slate grey) com grafia estilizada 'Hao Ye Cycles' estampada nas portas e no capô, para-choques e grade frontal cromados, rodas com calotas prateadas e caçamba com fundo preto (provavelmente modelo fabricado pela Kinsmart em escala |
| **#11** | `public/img/11.jpg` | Caminhão Antigo Calhambeque | **Ford Model BB Dump Truck** | Miniatura de caminhão vintage tipo caçamba/plataforma com cabine na cor vermelha, para-lamas pretos, caçamba preta com frisos vermelhos e simulação de carga de areia/pedra. Conta com grade frontal, para-choque, tanques e faróis cromados, além da inscrição 'TRUCK' na lateral do capô. |
| **#12** | `public/img/12.jpg` | Transport Truck | **Ford Model AA Truck (Estilo Clássico)** | Miniatura genérica em liga metálica (Alloy Truck) inspirada nos caminhões clássicos dos anos 1930 como o Ford Model AA. Apresenta cabine verde-escuro, para-lamas pretos, grade e para-choque cromados, e caçamba de carga cinza com inscrições 'ALLOY TRUCK'. |
| **#13** | `public/img/13.jpg` | Open Jeep | **Jeep Wrangler Unlimited Rubicon (JL)** | Miniatura die-cast na cor preta de um Jeep Wrangler JL de 4 portas com teto parcialmente aberto na traseira, grade frontal de 7 fendas destacada em prateado, detalhes de dobradiças nas portas em prata e pneus off-road com aros prateados. |
| **#15** | `public/img/15.jpg` | Aero Willys Sedan | **Volkswagen Golf GTI Mk1** | Miniatura na cor amarela, fabricante Welly, representando a primeira geração do Volkswagen Golf GTI. Possui teto solar, frisos laterais pretos e rodas de design típico da época. |
| **#33** | `public/img/33.jpg` | Fiat 147 | **Mercedes-Benz G63 AMG (W463)** | Miniatura na cor prata com teto preto, estilo SUV robusto, rodas de liga leve de cinco raios, detalhe de placa 'AMG' e emblema 'V8 Biturbo' na lateral. |
| **#36** | `public/img/36.jpg` | Chevrolet 3100 | **Ford Model T Delivery** | Miniatura estilo 'vintage delivery truck' com carroceria vermelha, teto preto, detalhes cromados em dourado, rodas tipo raiadas vermelhas com faixa branca e decalque 'Classic' nas laterais. |
| **#37** | `public/img/37.jpg` | Mini Cooper | **Chevrolet 3100 Pickup** | Miniatura de caminhonete clássica na cor preto fosco, com grade frontal e para-choques cromados, rodas estilo 'steelies' prateadas. O modelo é um Chevrolet 3100, divergindo da classificação atual no catálogo (Mini Cooper). |
| **#38** | `public/img/38.jpg` | Mercedes-Benz GLK | **Mini Cooper** | Miniatura na cor azul com teto branco, rodas esportivas prateadas de múltiplos raios e para-choques cromados. O catálogo estava incorretamente classificado como Mercedes-Benz GLK. |
| **#39** | `public/img/39.jpg` | Chrysler Maisto Anos 90 | **Mercedes-Benz GLK-Class (X204)** | Miniatura na cor dourada metálica com teto solar preto, rodas prateadas de 7 raios e detalhes frontais fiéis ao modelo GLK original. A classificação anterior como 'Chrysler' está incorreta. |
| **#40** | `public/img/40.jpg` | Fiat Uno 1.5 R | **Plymouth Prowler** | Miniatura na cor azul marinho, estilo roadster com rodas dianteiras expostas e para-choque dianteiro cinza proeminente. Fabricante Maisto, escala aproximada 1:64. |
| **#41** | `public/img/41.jpg` | Opel Astra GTC | **Fiat Uno 1.5 R** | Miniatura na cor vermelha com faixa preta lateral e inscrição 'UNO 1.5R', rodas de design esportivo, interior preto, representando a versão esportiva brasileira do Fiat Uno. |
| **#42** | `public/img/42.jpg` | Ford GT | **Opel Astra GTC** | Miniatura na cor branca de um hatchback de 3 portas, com logotipo da Opel visível na grade dianteira, faróis acrílicos transparentes e rodas prateadas de 5 raios. Totalmente divergente do catálogo (Ford GT). |
| **#43** | `public/img/43.jpg` | Dodge Ram | **Ford GT** | Miniatura vermelha com faixas esportivas brancas duplas no centro (capô, teto e traseira) e faixas laterais com a inscrição 'FORD GT'. Possui rodas prateadas de 5 raios, faróis detalhados e emblema azul da Ford na dianteira. |
| **#45** | `public/img/45.jpg` | Táxi Americano | **Hyundai Tucson (3ª Geração - TL)** | Miniatura na cor branca com teto preto, SUV de porte médio. A identificação do catálogo estava incorreta, pois não se trata de um táxi americano, mas sim de um SUV coreano. |
| **#46** | `public/img/46.jpg` | Chevrolet Bel Air | **Checker Marathon** | Miniatura na cor amarela, caracterizada como táxi de Nova York, com rodas esportivas modernas, teto com luminoso 'TAXI' e decais detalhados nas portas. O design frontal, embora estilizado na miniatura, remete ao clássico Checker Marathon. |
| **#48** | `public/img/48.jpg` | Jipe Exército dos EUA | **Mitsubishi Pajero Full (4ª Geração)** | Miniatura die-cast caracterizada como viatura da Polícia Rodoviária Federal (PRF) do Brasil. Possui pintura azul e amarela, sirene no teto e emblemas da PRF. As rodas são de 5 raios prateados. |
| **#51** | `public/img/51.jpg` | Toyota Camry | **Ford F-150 Raptor** | Miniatura de picape na cor amarela, com teto e detalhes em preto, ostentando o decalque 'RAPTOR' na lateral. Rodas esportivas pretas, design claramente baseado na linha F-150 Raptor de 13ª geração, não sendo um Toyota Camry nem um F-750. |
| **#54** | `public/img/54.jpg` | Bugatti SUV | **LTI (London Taxis International) TX4** | Miniatura na cor preta representando o icônico táxi de Londres, com grade frontal prateada, rodas de plástico simples e sinalizador de 'TAXI' no teto. |
| **#55** | `public/img/55.jpg` | Ford F-100 Picape | **Bugatti Galibier (conceito)** | Miniatura na cor vermelho metálico com rodas pretas de cinco raios. O design remete ao conceito Bugatti 16C Galibier. Não é uma picape Ford F-100. |
| **#60** | `public/img/60.jpg` | Lamborghini Urus | **Dodge Viper GTS** | Miniatura die-cast na cor vermelha, rodas multirraios prateadas, interior preto, detalhes dos faróis com máscara negra e saídas de ar no capô. Modelo típico de escala 1:36 com abertura de portas (fabricante Kinsmart). |
| **#61** | `public/img/61.jpg` | Pick Up Truck | **Mercedes-Benz CLS 63 AMG (C218)** | Miniatura na cor branca, modelo sedan de luxo com teto solar, rodas de cinco raios prateadas e insígnia 'V8 BITURBO' na lateral frontal. |
| **#62** | `public/img/62.jpg` | Dodge Viper GTS | **Mercedes-Benz 300 S Cabriolet** | Miniatura na cor azul com capota rebatida em tom bege/caramelo, grade frontal cromada característica e rodas simples de plástico cinza. |
| **#63** | `public/img/63.jpg` | Mercedes-Benz CLS 63 AMG | **BMW i8** | Miniatura na cor prata metálica com teto preto, detalhes em azul nas grades e saias laterais, rodas de liga leve esportivas. O registro do catálogo estava incorreto, pois o veículo real é um BMW i8, e não um Mercedes-Benz CLS 63 AMG. |
| **#66** | `public/img/66.jpg` | Ford GT | **Lotus Exige S** | Miniatura com pintura bicolor degradê (azul escuro para prata), com o número '3' no capô e nas portas, retrovisores vermelhos e aerofólio traseiro. O catálogo estava incorretamente identificado como Ford GT. |
| **#67** | `public/img/67.jpg` | Dodge Challenger T/A | **Maserati GranTurismo MC Stradale** | Miniatura na cor preto fosco (matte black), com rodas prateadas de múltiplos raios, faróis detalhados e entradas de ar no capô características do modelo MC Stradale. |
| **#68** | `public/img/68.jpg` | Lotus Exige S | **Chevrolet Corvette Sting Ray Split Window Coupe** | Miniatura na cor azul metálico, representando um Chevrolet Corvette 1963 com carroceria Split Window. Apresenta rodas cromadas, detalhes cromados nas aberturas do capô e emblemas característicos no para-lama. |
| **#69** | `public/img/69.jpg` | Maserati GranTurismo MC | **Lamborghini Miura P400 SV** | Miniatura na cor laranja metálico, apresenta rodas com design estilo raiadas, grade traseira preta e o emblema da Lamborghini no capô. A identificação difere totalmente do catálogo que apontava Maserati GranTurismo MC. |
| **#70** | `public/img/70.jpg` | Chevrolet Corvette Stingray | **Dodge Challenger SRT Demon** | Miniatura na cor preto fosco (matte black), com kit de carroceria larga (widebody), rodas pretas e detalhes de lanternas/faróis aparentes. O catálogo estava incorretamente identificado como Chevrolet Corvette. |
| **#71** | `public/img/71.jpg` | Lamborghini Miura P400 SV | **Volkswagen Golf GTI (Mk6)** | Miniatura na cor branca, modelo hatch de duas portas, rodas esportivas de cinco furos, grade frontal com detalhe vermelho e emblema GTI, luzes frontais detalhadas. |
| **#72** | `public/img/72.jpg` | Dodge Challenger SRT Demon | **Aston Martin DB5** | Miniatura na cor prata metálico, estilo clássico com rodas raiadas cromadas, grade frontal distinta e placa 'AM DB5'. Diverge completamente da descrição do catálogo (Dodge Challenger SRT Demon). |
| **#74** | `public/img/74.jpg` | Aston Martin DB5 | **Mercedes-Benz SLK-Class (R171)** | Miniatura na cor verde escuro com interior bege, rodas prateadas de cinco raios, apresentando faróis característicos da geração R171 do SLK. |
| **#77** | `public/img/77.jpg` | BMW 501/502 | **Chevrolet Camaro SS** | Miniatura na cor roxa metálica com faixas brancas sobre o capô, equipada com rodas personalizadas esportivas de perfil baixo (estilo aftermarket). |
| **#78** | `public/img/78.jpg` | Chevrolet Camaro | **MINI Countryman (R60) Rally/Police Variant** | Miniatura preta com teto branco, caracterizada como viatura policial. Possui luzes auxiliares no capô, aerofólio traseiro, rodas esportivas prateadas e adesivos laterais 'POLICE DIAL 911'. O modelo real é um MINI Countryman, não um Chevrolet Camaro. |
| **#79** | `public/img/79.jpg` | Volkswagen Fusca Polícia Federal | **Subaru Impreza WRC2007 (S12b)** | Miniatura na escala 1:64 com pintura decorativa 'muddy' (efeito de lama), representando o carro de rali de Petter Solberg. Possui aerofólio traseiro característico, rodas esportivas e detalhes de competição WRC. |
| **#80** | `public/img/80.jpg` | Subaru Impreza WRC | **Land Rover Defender 110** | Miniatura na cor preta, modelo Land Rover Defender 110, rodas de 5 raios, estribos laterais prateados, grade frontal detalhada com logo Land Rover e placa identificada como Land Rover. |
| **#82** | `public/img/82.jpg` | Chevrolet Camaro | **FNM / Alfa Romeo FNM 2000 JK (Berlina)** | Sedan clássico quatro portas em azul-escuro com teto/frisos cromados, grade frontal típica da Alfa Romeo com placa 'ALFA ROMEO', rodas originais prateadas; miniatura die-cast em escala 1:43 da coleção Carros Inesquecíveis do Brasil (IXO/Planeta DeAgostini). |
| **#83** | `public/img/83.jpg` | Alfa Romeo FNM JK 2000 | **Cadillac Series 62 Coupe** | Miniatura na cor preta, estilo cupê clássico, apresentando grade dianteira cromada característica e rodas raiadas. O veículo representado é um Cadillac e não um Alfa Romeo FNM JK 2000, portanto a classificação do catálogo está incorreta. |
| **#85** | `public/img/85.jpg` | Toyota FJ Cruiser | **Lada Samara Sedan (VAZ-21099)** | Miniatura na cor prata com para-choques pretos, rodas prateadas simples, representando um sedan clássico soviético. A identificação do catálogo estava incorreta. |
| **#86** | `public/img/86.jpg` | Lada Samara Sedan | **Ford Mustang GT** | Miniatura na cor verde metálico (Lime Gold), rodas cromadas de cinco raios, emblema 'GT' na lateral, faróis escurecidos e design característico da quinta geração do Mustang. |
| **#88** | `public/img/88.jpg` | Bentley Continental GT | **Porsche 356 Carrera** | Miniatura na cor azul metálico, estilo clássico com rodas prateadas estilo calota, para-choques cromados e interior bege. O catálogo estava incorretamente identificado como Bentley Continental GT. |
| **#89** | `public/img/89.jpg` | Porsche 356 Carrera | **Mercedes-Benz 500 SL (R129)** | Miniatura na cor lilás com decoração de corrida/patrocínio (Elkron, FAturbo), interior bege, rodas estilo 5 raios. Fabricante provável Majorette (conforme grafia no chassi típica desta linha de modelos europeus). |
| **#90** | `public/img/90.jpg` | Mercedes-Benz 500 SL | **Mercedes-Benz W123 (Sedan)** | Miniatura cor dourado metálico, estilo sedan quatro portas (carroceria W123), rodas prateadas estilo 'tampinha', faróis retangulares típicos da linha W123. A miniatura diverge do catálogo (que indica um 500 SL, que é um conversível de duas portas, modelo R107). |
| **#93** | `public/img/93.jpg` | Bugatti 16C Galibier | **Lamborghini Urus** | Miniatura na cor prata metálico, estilo SUV esportivo, rodas de cinco raios prateadas, janelas escurecidas e emblema da Lamborghini visível na dianteira. O catálogo original está incorreto, pois o veículo retratado é um Lamborghini Urus e não um Bugatti 16C Galibier. |
| **#94** | `public/img/94.jpg` | Cadillac Fleetwood | **Mercedes-Benz G-Class (G63 AMG 6x6 style conversion)** | Miniatura estilo 'toy' não licenciada (fictícia), representando uma picape baseada na Mercedes-Benz Classe G. Cor branca com teto e para-lamas pretos, rodas pretas esportivas, decalque lateral 'AMZ-G600' e luzes de teto. |
| **#99** | `public/img/99.jpg` | Ferrari 275 GTB | **Lincoln Continental** | Miniatura preta customizada estilo dragster com motor exposto cromado (blower), decais de chamas azul e dourado, rodas de cinco furos e grade frontal característica do Lincoln Continental 1965. |
| **#103** | `public/img/103.jpg` | Chevrolet Corvette Stingray | **Volkswagen Golf GTI (Mk6)** | Miniatura na cor branca, modelo hatchback de duas portas, rodas esportivas de cinco furos, grade frontal com o detalhe em vermelho característico do GTI e placa personalizada com o nome do modelo. |
---
## 📋 3. Tabela Completa das 75 Fotos Físicas Auditadas
| # | Foto | Catálogo Atual | Identificado pela IA | Status |
|:--|:-----|:---------------|:---------------------|:-------|
| #1 | `1.jpg` | Mercedes-Benz 500 SL | Mercedes-Benz 500 SL (R129) | ✅ Bate |
| #2 | `2.jpg` | Larven Modellauto Katalog | Desconhecido Desconhecido | ⚠️ Divergente |
| #4 | `4.jpg` | Ford Vicky | Ford '32 Ford Victoria (Vicky Hot Rod) | ✅ Bate |
| #5 | `5.jpg` | Fiat Idea | Fiat Idea | ✅ Bate |
| #6 | `6.jpg` | Ford Mustang | Ford Mustang Hardtop | ✅ Bate |
| #7 | `7.jpg` | Peugeot 504 | Peugeot 504 | ✅ Bate |
| #8 | `8.jpg` | Volkswagen 1600 (Zé do Caixão) | Volkswagen 1600 (Zé do Caixão) | ✅ Bate |
| #9 | `9.jpg` | Ford F1 | Desconhecido Desconhecido | ⚠️ Divergente |
| #10 | `10.jpg` | Dodge Ram 1500 | RAM 1500 Rebel | ✅ Bate |
| #11 | `11.jpg` | Caminhão Antigo Calhambeque | Ford Model BB Dump Truck | ⚠️ Divergente |
| #12 | `12.jpg` | Transport Truck | Ford Model AA Truck (Estilo Clássico) | ⚠️ Divergente |
| #13 | `13.jpg` | Open Jeep | Jeep Wrangler Unlimited Rubicon (JL) | ⚠️ Divergente |
| #14 | `14.jpg` | Chevrolet Bel Air | Chevrolet Bel Air Convertible | ✅ Bate |
| #15 | `15.jpg` | Aero Willys Sedan | Volkswagen Golf GTI Mk1 | ⚠️ Divergente |
| #16 | `16.jpg` | Fiat 125 | Fiat 125 | ✅ Bate |
| #18 | `18.jpg` | Lamborghini Veneno | Lamborghini Veneno | ✅ Bate |
| #19 | `19.jpg` | Bentley Continental GT | Bentley Continental GT | ✅ Bate |
| #20 | `20.jpg` | Toyota Bandeirante | Toyota Land Cruiser FJ45 Pickup | ✅ Bate |
| #21 | `21.jpg` | Jeep Wrangler Militar | Jeep Wrangler JK | ✅ Bate |
| #22 | `22.jpg` | Jeep Renegade Trailhawk | Jeep Renegade Trailhawk | ✅ Bate |
| #23 | `23.jpg` | Toyota Supra | Toyota Supra (A80) | ✅ Bate |
| #24 | `24.jpg` | Ford Focus ST | Ford Focus ST (Mk2) | ✅ Bate |
| #25 | `25.jpg` | Van Modelo a Identificar | Volkswagen Transporter T5 (Multivan/Caravelle) | 🔍 Identificado |
| #26 | `26.jpg` | Hyundai i30 | Hyundai i30 (primeira geração, FD) | ✅ Bate |
| #27 | `27.jpg` | Ford Explorer | Ford Explorer (1ª Geração) | ✅ Bate |
| #28 | `28.jpg` | Smart Fortwo Coupé | Smart Fortwo (W450) | ✅ Bate |
| #33 | `33.jpg` | Fiat 147 | Mercedes-Benz G63 AMG (W463) | ⚠️ Divergente |
| #35 | `35.jpg` | Calhambeque Modelo a Identificar | Trabant 601 | 🔍 Identificado |
| #36 | `36.jpg` | Chevrolet 3100 | Ford Model T Delivery | ⚠️ Divergente |
| #37 | `37.jpg` | Mini Cooper | Chevrolet 3100 Pickup | ⚠️ Divergente |
| #38 | `38.jpg` | Mercedes-Benz GLK | Mini Cooper | ⚠️ Divergente |
| #39 | `39.jpg` | Chrysler Maisto Anos 90 | Mercedes-Benz GLK-Class (X204) | ⚠️ Divergente |
| #40 | `40.jpg` | Fiat Uno 1.5 R | Plymouth Prowler | ⚠️ Divergente |
| #41 | `41.jpg` | Opel Astra GTC | Fiat Uno 1.5 R | ⚠️ Divergente |
| #42 | `42.jpg` | Ford GT | Opel Astra GTC | ⚠️ Divergente |
| #43 | `43.jpg` | Dodge Ram | Ford GT | ⚠️ Divergente |
| #45 | `45.jpg` | Táxi Americano | Hyundai Tucson (3ª Geração - TL) | ⚠️ Divergente |
| #46 | `46.jpg` | Chevrolet Bel Air | Checker Marathon | ⚠️ Divergente |
| #48 | `48.jpg` | Jipe Exército dos EUA | Mitsubishi Pajero Full (4ª Geração) | ⚠️ Divergente |
| #51 | `51.jpg` | Toyota Camry | Ford F-150 Raptor | ⚠️ Divergente |
| #52 | `52.jpg` | BMW Modelo a Identificar | Toyota Camry | 🔍 Identificado |
| #54 | `54.jpg` | Bugatti SUV | LTI (London Taxis International) TX4 | ⚠️ Divergente |
| #55 | `55.jpg` | Ford F-100 Picape | Bugatti Galibier (conceito) | ⚠️ Divergente |
| #56 | `56.jpg` | Koenigsegg Modelo a Identificar | Ford F-100 Pickup | 🔍 Identificado |
| #60 | `60.jpg` | Lamborghini Urus | Dodge Viper GTS | ⚠️ Divergente |
| #61 | `61.jpg` | Pick Up Truck | Mercedes-Benz CLS 63 AMG (C218) | ⚠️ Divergente |
| #62 | `62.jpg` | Dodge Viper GTS | Mercedes-Benz 300 S Cabriolet | ⚠️ Divergente |
| #63 | `63.jpg` | Mercedes-Benz CLS 63 AMG | BMW i8 | ⚠️ Divergente |
| #66 | `66.jpg` | Ford GT | Lotus Exige S | ⚠️ Divergente |
| #67 | `67.jpg` | Dodge Challenger T/A | Maserati GranTurismo MC Stradale | ⚠️ Divergente |
| #68 | `68.jpg` | Lotus Exige S | Chevrolet Corvette Sting Ray Split Window Coupe | ⚠️ Divergente |
| #69 | `69.jpg` | Maserati GranTurismo MC | Lamborghini Miura P400 SV | ⚠️ Divergente |
| #70 | `70.jpg` | Chevrolet Corvette Stingray | Dodge Challenger SRT Demon | ⚠️ Divergente |
| #71 | `71.jpg` | Lamborghini Miura P400 SV | Volkswagen Golf GTI (Mk6) | ⚠️ Divergente |
| #72 | `72.jpg` | Dodge Challenger SRT Demon | Aston Martin DB5 | ⚠️ Divergente |
| #74 | `74.jpg` | Aston Martin DB5 | Mercedes-Benz SLK-Class (R171) | ⚠️ Divergente |
| #77 | `77.jpg` | BMW 501/502 | Chevrolet Camaro SS | ⚠️ Divergente |
| #78 | `78.jpg` | Chevrolet Camaro | MINI Countryman (R60) Rally/Police Variant | ⚠️ Divergente |
| #79 | `79.jpg` | Volkswagen Fusca Polícia Federal | Subaru Impreza WRC2007 (S12b) | ⚠️ Divergente |
| #80 | `80.jpg` | Subaru Impreza WRC | Land Rover Defender 110 | ⚠️ Divergente |
| #82 | `82.jpg` | Chevrolet Camaro | FNM / Alfa Romeo FNM 2000 JK (Berlina) | ⚠️ Divergente |
| #83 | `83.jpg` | Alfa Romeo FNM JK 2000 | Cadillac Series 62 Coupe | ⚠️ Divergente |
| #84 | `84.jpg` | Cadillac Modelo a Identificar | Toyota FJ Cruiser | 🔍 Identificado |
| #85 | `85.jpg` | Toyota FJ Cruiser | Lada Samara Sedan (VAZ-21099) | ⚠️ Divergente |
| #86 | `86.jpg` | Lada Samara Sedan | Ford Mustang GT | ⚠️ Divergente |
| #88 | `88.jpg` | Bentley Continental GT | Porsche 356 Carrera | ⚠️ Divergente |
| #89 | `89.jpg` | Porsche 356 Carrera | Mercedes-Benz 500 SL (R129) | ⚠️ Divergente |
| #90 | `90.jpg` | Mercedes-Benz 500 SL | Mercedes-Benz W123 (Sedan) | ⚠️ Divergente |
| #93 | `93.jpg` | Bugatti 16C Galibier | Lamborghini Urus | ⚠️ Divergente |
| #94 | `94.jpg` | Cadillac Fleetwood | Mercedes-Benz G-Class (G63 AMG 6x6 style conversion) | ⚠️ Divergente |
| #99 | `99.jpg` | Ferrari 275 GTB | Lincoln Continental | ⚠️ Divergente |
| #103 | `103.jpg` | Chevrolet Corvette Stingray | Volkswagen Golf GTI (Mk6) | ⚠️ Divergente |
---
## 📸 4. Modelos do Catálogo Aguardando Foto Física (30)
Estes modelos utilizam o logotipo padrão e aguardam fotografia no Gabarito de Estúdio:
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