import fs from 'fs';
import path from 'path';

// Lê chave de ambiente, de .env ou de argumento CLI
let apiKey = process.env.GEMINI_API_KEY || '';
if (!apiKey && fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const match = envContent.match(/GEMINI_API_KEY=([^\r\n]+)/);
  if (match) apiKey = match[1].trim();
}

const keyArg = process.argv.find(a => a.startsWith('--key='));
if (keyArg) {
  apiKey = keyArg.split('=')[1].trim();
}

console.log('🏎️ AUDITORIA VISUAL DE FOTOS E NOMES - GARAGEM EM MINIATURA (PereiraLabs)');
console.log('========================================================================');

// 1. Extrai carros do src/data/cars.ts
const carsFile = fs.readFileSync('src/data/cars.ts', 'utf-8');
const cars = [];
const carRegex = /\{\s*id:\s*(\d+),\s*marca:\s*"([^"]*)",\s*modelo:\s*"([^"]*)",\s*ano:\s*"([^"]*)",\s*fabricante:\s*"([^"]*)",\s*categoria:\s*"([^"]*)"/g;
let match;
while ((match = carRegex.exec(carsFile)) !== null) {
  cars.push({
    id: Number(match[1]),
    marca: match[2],
    modelo: match[3],
    ano: match[4],
    fabricante: match[5],
    categoria: match[6]
  });
}

console.log(`📋 Total de veículos carregados do catálogo: ${cars.length}`);

// 2. Mapeia arquivos em public/img
const imgDir = path.resolve('public/img');
const imgFiles = fs.readdirSync(imgDir).filter(f => f.endsWith('.jpg')).sort((a, b) => {
  const numA = parseInt(a.replace('.jpg', ''), 10) || 0;
  const numB = parseInt(b.replace('.jpg', ''), 10) || 0;
  return numA - numB;
});

console.log(`📸 Total de fotos físicas encontradas em public/img/: ${imgFiles.length}`);

// 3. Mapeamento preliminar
const auditList = [];
const photoIdSet = new Set(imgFiles.map(f => parseInt(f.replace('.jpg', ''), 10)));

for (const file of imgFiles) {
  const id = parseInt(file.replace('.jpg', ''), 10);
  const catalogEntry = cars.find(c => c.id === id);

  auditList.push({
    file,
    id,
    catalogCar: catalogEntry
      ? `#${catalogEntry.id} ${catalogEntry.marca} ${catalogEntry.modelo} (${catalogEntry.ano})`
      : 'ID não cadastrado no catálogo',
    isGeneric: catalogEntry ? catalogEntry.modelo.includes('Modelo a Identificar') : false,
    status: catalogEntry ? (catalogEntry.modelo.includes('Modelo a Identificar') ? 'PRECISA_IDENTIFICAR' : 'CADASTRADO') : 'SEM_CADASTRO'
  });
}

const toIdentify = auditList.filter(a => a.status === 'PRECISA_IDENTIFICAR');
const missingPhotos = cars.filter(c => !photoIdSet.has(c.id));

console.log(`\n🔍 RESUMO PRELIMINAR:`);
console.log(`- Veículos no catálogo: ${cars.length}`);
console.log(`- Fotos físicas prontas: ${imgFiles.length}`);
console.log(`- Veículos aguardando foto: ${missingPhotos.length}`);
console.log(`- Modelos marcados como "Modelo a Identificar": ${toIdentify.length}`);

// Chamada à API com suporte a modelos múltiplos
async function callGeminiVision(base64Data, file, catalogEntry, id) {
  const prompt = `Você é um curador e especialista em réplicas e miniaturas die-cast de automóveis (Hot Wheels, Matchbox, Maisto, Bburago, Welly, Jada, Kinsmart, etc.).
Analise esta foto da miniatura.
No catálogo do acervo, este arquivo '${file}' está associado ao veículo: #${catalogEntry?.id || id} Marca: '${catalogEntry?.marca || 'Desconhecida'}', Modelo: '${catalogEntry?.modelo || 'Desconhecido'}'.

Identifique com precisão o veículo real representado pela miniatura e responda ESTRITAMENTE em formato JSON (sem blocos markdown \`\`\`):
{
  "identifiedBrand": "Marca real do veículo (ex: Volkswagen, Ford, BMW, etc.)",
  "identifiedModel": "Modelo real específico (ex: T1 Samba Bus, Mustang Fastback, M3 E30, etc.)",
  "identifiedYear": "Ano aproximado do veículo real",
  "isMatch": true ou false (true se a foto bate com a marca e modelo do catálogo, false se for divergente ou se o catálogo estava como Modelo a Identificar),
  "details": "Breve descrição visual da miniatura (cor principal, rodas, decais, fabricante da miniatura se visível)"
}`;

  const models = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];

  for (const model of models) {
    for (let retry = 0; retry < 3; retry++) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Data
                  }
                }
              ]
            }]
          })
        });

        if (response.status === 429) {
          process.stdout.write(` [429 aguardando 4s...] `);
          await new Promise(r => setTimeout(r, 4000));
          continue;
        }

        if (response.status === 503) {
          process.stdout.write(` [503 ocupado, aguardando 2s...] `);
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }

        if (!response.ok) {
          continue;
        }

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const cleanJson = rawText
          .replace(/```json/gi, '')
          .replace(/```/g, '')
          .trim();

        try {
          return JSON.parse(cleanJson);
        } catch {
          return { details: rawText };
        }
      } catch {
        await new Promise(r => setTimeout(r, 1500));
      }
    }
  }

  throw new Error('Falha em todos os modelos de IA.');
}

async function runGeminiVisionAudit() {
  if (!apiKey) {
    console.error('\n❌ Chave da API não fornecida! Use --key=SUA_CHAVE ou defina em .env');
    process.exit(1);
  }

  console.log(`\n🚀 INICIANDO AUDITORIA VISUAL DE TODAS AS ${imgFiles.length} FOTOS COM GOOGLE GEMINI...`);
  console.log('------------------------------------------------------------------------');

  fs.mkdirSync('src/data/ia_reports', { recursive: true });

  // Carrega resultados parciais se já existirem
  let results = [];
  const resultsPath = 'src/data/ia_reports/audit_results.json';
  if (fs.existsSync(resultsPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
      if (Array.isArray(existing) && existing.length > 0) {
        results = existing;
      }
    } catch {}
  }

  const processedIds = new Set(results.filter(r => r.status === 'ANALISADO_GEMINI').map(r => r.id));

  for (let i = 0; i < imgFiles.length; i++) {
    const file = imgFiles[i];
    const id = parseInt(file.replace('.jpg', ''), 10);
    const catalogEntry = cars.find(c => c.id === id);

    if (processedIds.has(id)) {
      console.log(`[${i + 1}/${imgFiles.length}] Foto #${id} (${file}) já auditada anteriormente. Pulando...`);
      continue;
    }

    const imgPath = path.join(imgDir, file);
    const base64Data = fs.readFileSync(imgPath).toString('base64');

    process.stdout.write(`[${i + 1}/${imgFiles.length}] Foto #${id} (${file} - ${catalogEntry ? catalogEntry.marca + ' ' + catalogEntry.modelo : 'Sem cadastro'})... `);

    try {
      const parsed = await callGeminiVision(base64Data, file, catalogEntry, id);
      const isMatch = Boolean(parsed.isMatch);

      const entryResult = {
        file,
        id,
        catalog: catalogEntry ? `${catalogEntry.marca} ${catalogEntry.modelo}` : 'Não cadastrado',
        catalogBrand: catalogEntry?.marca || '—',
        catalogModel: catalogEntry?.modelo || '—',
        catalogYear: catalogEntry?.ano || '—',
        status: 'ANALISADO_GEMINI',
        identifiedBrand: parsed.identifiedBrand || parsed.marca_real || parsed.marca || 'Desconhecido',
        identifiedModel: parsed.identifiedModel || parsed.modelo_real || parsed.modelo || 'Desconhecido',
        identifiedYear: parsed.identifiedYear || parsed.ano_aproximado || parsed.ano || '—',
        isMatch: isMatch,
        isGenericInCatalog: catalogEntry ? catalogEntry.modelo.includes('Modelo a Identificar') : false,
        details: parsed.details || parsed.marca_miniatura || ''
      };

      // Atualiza ou insere
      const existingIdx = results.findIndex(r => r.id === id);
      if (existingIdx >= 0) {
        results[existingIdx] = entryResult;
      } else {
        results.push(entryResult);
      }

      const statusTag = entryResult.isGenericInCatalog
        ? `🔍 IDENTIFICADO: ${entryResult.identifiedBrand} ${entryResult.identifiedModel} (${entryResult.identifiedYear})`
        : (isMatch ? '✅ Bate' : `⚠️ DIVERGENTE: ${entryResult.identifiedBrand} ${entryResult.identifiedModel}`);

      console.log(statusTag);
    } catch (err) {
      console.log(`❌ Erro: ${err.message}`);
    }

    // Salva progresso incremental a cada foto
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2), 'utf-8');

    // Pausa amigável de 1.2s para cota
    await new Promise(r => setTimeout(r, 1200));
  }

  // 4. Gera Relatório Executivo Markdown Completo
  const identifiedGenerics = results.filter(r => r.isGenericInCatalog);
  const divergentList = results.filter(r => !r.isMatch && !r.isGenericInCatalog && r.status === 'ANALISADO_GEMINI');
  const matchedList = results.filter(r => r.isMatch);

  const mdLines = [
    `# 🏎️ Relatório Completo de Auditoria Visual — Garagem em Miniatura`,
    `**Data de Execução:** ${new Date().toLocaleString('pt-BR')}  `,
    `**Motor de IA:** Google Gemini Multimodal Vision (Google AI Studio)  `,
    `**Curadoria:** PereiraLabs (Louzada & Pereira - Soluções Digitais)  `,
    `**Arquivo de Dados Estruturado:** \`src/data/ia_reports/audit_results.json\`  `,
    ``,
    `---`,
    ``,
    `## 📊 Resumo Executivo da Auditoria`,
    `- **Total de Modelos no Catálogo (\`cars.ts\`):** ${cars.length}`,
    `- **Total de Fotos Físicas Auditadas (\`public/img/\`):** ${imgFiles.length}`,
    `- **Miniaturas com Identificação Confirmada (Batem com Catálogo):** ${matchedList.length} ✅`,
    `- **Modelos Genéricos Solucionados pela IA ("Modelo a Identificar"):** ${identifiedGenerics.length} 🔍`,
    `- **Possíveis Divergências ou Ajustes Sugeridos pela IA:** ${divergentList.length} ⚠️`,
    `- **Modelos no Catálogo Aguardando Foto Física:** ${missingPhotos.length} 📸`,
    ``,
    `---`,
    ``,
    `## 🔍 1. Modelos Genéricos Solucionados pelo Gemini Vision (${identifiedGenerics.length})`,
    `A IA inspecionou as miniaturas físicas e revelou os modelos reais que estavam cadastrados como genéricos:`,
    ``,
    `| ID | Foto | Nome Antigo no Catálogo | Veículo Identificado pela IA | Detalhes Visuais Observados |`,
    `|:---|:-----|:------------------------|:-----------------------------|:----------------------------|`,
    ...identifiedGenerics.map(item =>
      `| **#${item.id}** | \`public/img/${item.file}\` | ${item.catalog} | **${item.identifiedBrand} ${item.identifiedModel} (${item.identifiedYear})** | ${item.details} |`
    ),
    ``,
    `---`,
    ``,
    `## ⚠️ 2. Possíveis Divergências / Ajustes Sugeridos (${divergentList.length})`,
    `Casos em que a miniatura física apresenta variações de versão, geração ou nome em relação ao catálogo:`,
    ``,
    `| ID | Foto | Nome no Catálogo | Identificado na Foto pela IA | Observação |`,
    `|:---|:-----|:-----------------|:-----------------------------|:-----------|`,
    ...divergentList.map(item =>
      `| **#${item.id}** | \`public/img/${item.file}\` | ${item.catalog} | **${item.identifiedBrand} ${item.identifiedModel}** | ${item.details} |`
    ),
    divergentList.length === 0 ? `*Nenhuma divergência crítica encontrada. O catálogo está alinhado com as miniaturas físicas!*` : '',
    ``,
    `---`,
    ``,
    `## 📋 3. Tabela Completa das 75 Fotos Físicas Auditadas`,
    ``,
    `| # | Foto | Catálogo Atual | Identificado pela IA | Status |`,
    `|:--|:-----|:---------------|:---------------------|:-------|`,
    ...results.map(r =>
      `| #${r.id} | \`${r.file}\` | ${r.catalog} | ${r.identifiedBrand || '—'} ${r.identifiedModel || ''} | ${r.isGenericInCatalog ? '🔍 Identificado' : (r.isMatch ? '✅ Bate' : '⚠️ Divergente')} |`
    ),
    ``,
    `---`,
    ``,
    `## 📸 4. Modelos do Catálogo Aguardando Foto Física (${missingPhotos.length})`,
    `Estes modelos utilizam o logotipo padrão e aguardam fotografia no Gabarito de Estúdio:`,
    ``,
    `| ID | Veículo | Categoria | Fabricante |`,
    `|:---|:--------|:----------|:-----------|`,
    ...missingPhotos.map(c => `| #${c.id} | ${c.marca} ${c.modelo} (${c.ano}) | ${c.categoria} | ${c.fabricante} |`),
    ``
  ].filter(Boolean);

  fs.writeFileSync('AUDITORIA_ACERVO_GEMINI.md', mdLines.join('\n'), 'utf-8');

  console.log('\n========================================================================');
  console.log('🎉 AUDITORIA VISUAL CONCLUÍDA COM SUCESSO!');
  console.log(`- Fotos analisadas: ${results.filter(r => r.status === 'ANALISADO_GEMINI').length}/${imgFiles.length}`);
  console.log(`- Modelos genéricos revelados: ${identifiedGenerics.length}`);
  console.log('📁 Dados estruturados salvos em: src/data/ia_reports/audit_results.json');
  console.log('📄 Relatório completo gerado em: AUDITORIA_ACERVO_GEMINI.md');
}

runGeminiVisionAudit();
