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

console.log('🏎️ AUDITORIA DE FOTOS E NOMES - GARAGEM EM MINIATURA (PereiraLabs)');
console.log('==================================================================');

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

// 3. Mapeamento cruzado (Foto x Catálogo)
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

console.log(`\n🔍 RESUMO PRELIMINAR DA AUDITORIA:`);
console.log(`- Total de veículos no catálogo: ${cars.length}`);
console.log(`- Veículos com foto física (.jpg): ${cars.length - missingPhotos.length}`);
console.log(`- Veículos aguardando foto física: ${missingPhotos.length}`);
console.log(`- Fotos físicas com nome genérico ("Modelo a Identificar"): ${toIdentify.length}`);
toIdentify.forEach(item => {
  console.log(`  • Foto public/img/${item.file} ➔ ${item.catalogCar}`);
});

// Se houver chave da API, processa com Gemini Vision
async function runGeminiVisionAudit() {
  const results = [];

  if (!apiKey) {
    console.log('\n⚠️ Nenhuma chave GEMINI_API_KEY informada no momento.');
    console.log('👉 Para rodar a análise visual das fotos com Gemini Vision:');
    console.log('   node scripts/audit_collection.mjs --key=SUA_CHAVE_GEMINI');
    console.log('\n📄 Gerando relatório estruturado de auditoria do acervo...');

    for (const item of auditList) {
      results.push({
        file: item.file,
        id: item.id,
        catalog: item.catalogCar,
        status: item.status,
        identifiedBrand: item.isGeneric ? 'Aguardando Gemini Vision' : item.catalogCar.split(' ')[1] || '',
        identifiedModel: item.isGeneric ? 'Aguardando Gemini Vision' : item.catalogCar.split(' ').slice(2).join(' ') || '',
        isMatch: !item.isGeneric,
        details: item.isGeneric ? 'Miniatura necessita identificação com IA ou curador.' : 'Foto associada ao catálogo.'
      });
    }
  } else {
    console.log('\n🚀 Iniciando análise visual com Google Gemini Vision...');
    for (let i = 0; i < imgFiles.length; i++) {
      const file = imgFiles[i];
      const id = parseInt(file.replace('.jpg', ''), 10);
      const catalogEntry = cars.find(c => c.id === id);
      const imgPath = path.join(imgDir, file);
      const base64Data = fs.readFileSync(imgPath).toString('base64');

      console.log(`[${i + 1}/${imgFiles.length}] Analisando public/img/${file}...`);

      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  text: `Você é um curador e especialista em réplicas e miniaturas de automóveis die-cast (Hot Wheels, Matchbox, Maisto, Bburago, Welly, etc.).
Analise esta foto da miniatura.
No catálogo, este arquivo '${file}' está associado ao veículo: #${catalogEntry?.id || id} Marca: '${catalogEntry?.marca || 'Desconhecida'}', Modelo: '${catalogEntry?.modelo || 'Desconhecido'}'.

Identifique o veículo real representado pela miniatura e responda ESTRITAMENTE em formato JSON (sem blocos markdown):
{
  "identifiedBrand": "Marca real da miniatura",
  "identifiedModel": "Modelo real da miniatura",
  "identifiedYear": "Ano aproximado do veículo",
  "isMatch": true,
  "details": "Breve descrição visual do modelo (cor, detalhes, decais)"
}`
                },
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

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        let parsed = {};
        try {
          parsed = JSON.parse(cleanJson);
        } catch {
          parsed = { details: rawText };
        }

        results.push({
          file,
          id,
          catalog: catalogEntry ? `${catalogEntry.marca} ${catalogEntry.modelo}` : 'Não cadastrado',
          status: 'ANALISADO_GEMINI',
          ...parsed
        });
        console.log(`  -> Identificado: ${parsed.identifiedBrand || ''} ${parsed.identifiedModel || ''} | Bate: ${parsed.isMatch ? 'SIM ✅' : 'DIVERGENTE ⚠️'}`);
      } catch (err) {
        console.error(`  Erro na análise de ${file}:`, err.message);
      }

      await new Promise(r => setTimeout(r, 1200));
    }
  }

  // Garante existência de src/data/ia_reports
  fs.mkdirSync('src/data/ia_reports', { recursive: true });
  fs.writeFileSync('src/data/ia_reports/audit_results.json', JSON.stringify(results, null, 2), 'utf-8');

  // Gera relatório Markdown completo
  const mdLines = [
    `# 🏎️ Relatório de Auditoria do Acervo — Garagem em Miniatura`,
    `**Data:** ${new Date().toLocaleString('pt-BR')}  `,
    `**Curadoria:** PereiraLabs (Louzada & Pereira - Soluções Digitais)  `,
    `**Arquivo de Dados:** \`src/data/ia_reports/audit_results.json\`  `,
    ``,
    `---`,
    ``,
    `## 📊 Resumo Executivo`,
    `- **Total de Veículos no Catálogo (\`cars.ts\`):** ${cars.length}`,
    `- **Total de Fotos Físicas em \`public/img/\`:** ${imgFiles.length}`,
    `- **Veículos com Fotos Existentes:** ${cars.length - missingPhotos.length}`,
    `- **Veículos Aguardando Fotos:** ${missingPhotos.length}`,
    `- **Miniaturas com Nomenclatura Genérica ("Modelo a Identificar"):** ${toIdentify.length}`,
    ``,
    `---`,
    ``,
    `## 🔍 1. Miniaturas com Foto Física que Precisam de Identificação`,
    `As fotos físicas existem em \`public/img/\`, mas estão cadastradas como modelos genéricos no catálogo:`,
    ``,
    `| ID | Foto | Nome Atual no Catálogo | Ação Recomendada |`,
    `|:---|:-----|:-----------------------|:------------------|`,
    ...toIdentify.map(item => `| #${item.id} | \`public/img/${item.file}\` | ${item.catalogCar} | Rodar com Gemini Vision ou classificar via Modo Curador |`),
    ``,
    `---`,
    ``,
    `## 📸 2. Veículos no Catálogo Aguardando Foto Física (${missingPhotos.length})`,
    `Estes modelos estão cadastrados no acervo, mas não possuem arquivo \`.jpg\` correspondente em \`public/img/\` (utilizam o logo padrão temporário):`,
    ``,
    `| ID | Veículo | Categoria | Fabricante |`,
    `|:---|:--------|:----------|:-----------|`,
    ...missingPhotos.slice(0, 30).map(c => `| #${c.id} | ${c.marca} ${c.modelo} (${c.ano}) | ${c.categoria} | ${c.fabricante} |`),
    missingPhotos.length > 30 ? `| ... | *(mais ${missingPhotos.length - 30} veículos)* | | |` : '',
    ``,
    `---`,
    ``,
    `## 🛠️ Como Executar a Auditoria Visual Completa com Gemini`,
    `Para enviar todas as fotos físicas para identificação automatizada no Google Gemini Vision:`,
    `\`\`\`bash`,
    `node scripts/audit_collection.mjs --key=SUA_CHAVE_GEMINI_AQUI`,
    `\`\`\``,
    `Os resultados serão atualizados automaticamente em \`src/data/ia_reports/audit_results.json\` e exibidos na aba de Curadoria dentro do aplicativo.`
  ].filter(Boolean);

  fs.writeFileSync('AUDITORIA_ACERVO_GEMINI.md', mdLines.join('\n'), 'utf-8');
  console.log('\n✅ Auditoria concluída com sucesso!');
  console.log('📁 Arquivo JSON: src/data/ia_reports/audit_results.json');
  console.log('📄 Relatório Markdown: AUDITORIA_ACERVO_GEMINI.md');
}

runGeminiVisionAudit();

