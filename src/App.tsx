import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { App as CapacitorApp } from '@capacitor/app';
import { GoogleGenAI } from '@google/genai';
import pkg from '../package.json';
import { CARS_DATA } from './data/cars';
import { CURATOR_ENDPOINTS } from './config/curatorEndpoints';
import type {
  CarItem,
  CarCategory,
  ReactionsMap,
  StoriesMap,
  SearchLogEntry,
  IaReportEntry
} from './types/car';
import './App.css';

const WHATSAPP_NUMERO = '5535992344229';
const DEV_EMAIL = 'pereiralabs@outlook.com';
const LOGO_PADRAO = 'img/logo-garagem.png';

const CATEGORIES: { label: string; value: CarCategory }[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Clássicos', value: 'Clássico' },
  { label: 'Nacionais', value: 'Nacional' },
  { label: 'Esportivos', value: 'Esportivo' },
  { label: 'Muscle Cars', value: 'Muscle Car' },
  { label: 'Picapes & Utilitários', value: 'Utilitário' },
  { label: 'Viaturas & Serviços', value: 'Viatura / Serviço' }
];

function loadReactions(): ReactionsMap {
  try {
    const raw = localStorage.getItem('garagem_reactions');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function loadStories(): StoriesMap {
  try {
    const raw = localStorage.getItem('garagem_stories');
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoriesMap;
    const cleaned: StoriesMap = {};
    for (const [key, item] of Object.entries(parsed)) {
      if (item && item.story) {
        cleaned[Number(key)] = {
          ...item,
          story: cleanAiMarkdownText(item.story)
        };
      }
    }
    return cleaned;
  } catch {
    return {};
  }
}

function loadSearchLogs(): SearchLogEntry[] {
  try {
    const raw = localStorage.getItem('garagem_search_logs');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadIaReports(): IaReportEntry[] {
  try {
    const raw = localStorage.getItem('garagem_ia_reports');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * 1. Formatação Amigável (Clean UI):
 * Remove blocos de código brutos (```...```), deduplica parágrafos repetidos
 * e limpa artefatos de formatação para renderização elegante via react-markdown.
 */
function cleanAiMarkdownText(raw: string): string {
  const withoutFences = raw
    .replace(/```(?:markdown|json|text|html)?\s*([\s\S]*?)```/gi, '$1')
    .replace(/`([^`\n]+)`/g, '$1')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Remove linhas ou parágrafos consecutivos idênticos caso a IA repita blocos
  const blocks = withoutFences.split('\n\n');
  const uniqueBlocks: string[] = [];
  for (const block of blocks) {
    const trimmedBlock = block.trim();
    if (!trimmedBlock) continue;
    const prevBlock = uniqueBlocks[uniqueBlocks.length - 1];
    if (!prevBlock || prevBlock.toLowerCase() !== trimmedBlock.toLowerCase()) {
      uniqueBlocks.push(trimmedBlock);
    }
  }

  return uniqueBlocks.join('\n\n');
}

/**
 * Limpa marcações Markdown para exibição resumida no card da grade do catálogo.
 */
function stripMarkdownPreview(md: string): string {
  return md
    .replace(/^[#>*\-\d.]+\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 3. Inteligência de Vínculo de Coleção:
 * Detecta se o veículo retornado pela IA já existe no acervo de 105 carros
 * ou se é uma recomendação de nova compra.
 */
function analyzeCollectionLink(cleanText: string): {
  matchedCar: CarItem | null;
  isNewAcquisition: boolean;
  detectedName: string;
} {
  const lower = cleanText.toLowerCase();
  const explicitlyNotInCollection =
    lower.includes('possível nova aquisição') ||
    lower.includes('possivel nova aquisicao') ||
    lower.includes('não existe na lista') ||
    lower.includes('nao existe na lista') ||
    lower.includes('não consta no acervo') ||
    lower.includes('sugestão de próxima compra');

  // Tenta extrair o nome do modelo identificado na primeira seção
  const nameMatch =
    cleanText.match(/(?:Marca|Modelo|Ve[íi]culo)[^:\n]*:\s*\**([^\n*]+)/i) ||
    cleanText.match(/1\.\s*\**([^\n*]+)/);
  const detectedName = nameMatch ? nameMatch[1].trim() : 'Veículo Analisado pela IA';

  if (!explicitlyNotInCollection) {
    // 1º: Procura referência explícita #ID na conclusão de existência
    const idMatches = [...cleanText.matchAll(/#(\d{1,3})\b/g)];
    if (idMatches.length > 0) {
      const firstId = Number(idMatches[0][1]);
      const byId = CARS_DATA.find((c) => c.id === firstId);
      if (byId) {
        return { matchedCar: byId, isNewAcquisition: false, detectedName };
      }
    }

    // 2º: Procura correspondência por marca + modelo no texto
    const byBrandModel = CARS_DATA.find((c) => {
      if (c.modelo.includes('Modelo a Identificar')) return false;
      const brandLower = c.marca.toLowerCase();
      const modelLower = c.modelo.toLowerCase();
      return lower.includes(brandLower) && lower.includes(modelLower);
    });

    if (byBrandModel) {
      return { matchedCar: byBrandModel, isNewAcquisition: false, detectedName };
    }
  }

  return { matchedCar: null, isNewAcquisition: true, detectedName };
}

/**
 * Comprime a foto para máx. 800px JPEG (qualidade 0.82) via HTML5 Canvas.
 * IMPORTANTE (Conformidade Google Play / Apple App Store / LGPD):
 * O redesenho em <canvas> remove 100% dos metadados EXIF ocultos (como localização GPS,
 * modelo do aparelho e data/hora do dispositivo), enviando apenas os pixels da miniatura.
 */
function compressAndStripExifBase64(dataUrl: string, maxDim = 800): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl.split(',')[1] || '');
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const cleanDataUrl = canvas.toDataURL('image/jpeg', 0.82);
      resolve(cleanDataUrl.split(',')[1] || '');
    };
    img.onerror = () => resolve(dataUrl.split(',')[1] || '');
    img.src = dataUrl;
  });
}

function CarImage({ car, className }: { car: CarItem; className?: string }) {
  const [failed, setFailed] = useState(false);
  const hasDirectPhoto = Boolean(car.foto && car.foto.trim() !== '');
  const fotoPath = hasDirectPhoto ? car.foto : `img/${car.id}.jpg`;

  if (failed) {
    return (
      <div className={className === 'modal-img' ? 'modal-fallback' : 'placeholder-fallback'}>
        <img
          src={LOGO_PADRAO}
          alt="Garagem em Miniatura"
          className={className === 'modal-img' ? 'logo-fallback-modal' : 'logo-fallback-img'}
        />
      </div>
    );
  }

  return (
    <img
      src={encodeURI(fotoPath)}
      alt={`${car.marca} ${car.modelo}`}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('garagem_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CarCategory>('todos');
  const [reactions, setReactions] = useState<ReactionsMap>(loadReactions);
  const [stories, setStories] = useState<StoriesMap>(loadStories);
  const [searchLogs, setSearchLogs] = useState<SearchLogEntry[]>(loadSearchLogs);
  const [iaReports, setIaReports] = useState<IaReportEntry[]>(loadIaReports);
  const [storyDraft, setStoryDraft] = useState('');
  const [isEditingStory, setIsEditingStory] = useState(false);
  const [pendingAiStories, setPendingAiStories] = useState<Record<number, string>>({});
  const [openDislikeId, setOpenDislikeId] = useState<number | null>(null);
  const [dislikeDrafts, setDislikeDrafts] = useState<Record<number, string>>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [highlightedCarId, setHighlightedCarId] = useState<number | null>(null);

  // Modais
  const [selectedCar, setSelectedCar] = useState<CarItem | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);

  // Estado IA Scanner & Consentimento de Curadoria (destinos fixos no código em src/config/curatorEndpoints.ts)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [cloudSyncConsent, setCloudSyncConsent] = useState(
    () => localStorage.getItem('garagem_cloud_consent') !== 'false'
  );
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [selectedImageMime, setSelectedImageMime] = useState('image/jpeg');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [lastSavedReport, setLastSavedReport] = useState<IaReportEntry | null>(null);
  const [isSyncingPending, setIsSyncingPending] = useState(false);

  useEffect(() => {
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(theme === 'light' ? 'light-theme' : 'dark-theme');
    try {
      localStorage.setItem('garagem_theme', theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem('garagem_reactions', JSON.stringify(reactions));
    } catch {
      // ignore storage errors
    }
  }, [reactions]);

  useEffect(() => {
    try {
      localStorage.setItem('garagem_stories', JSON.stringify(stories));
    } catch {
      // ignore storage errors
    }
  }, [stories]);

  useEffect(() => {
    try {
      localStorage.setItem('garagem_search_logs', JSON.stringify(searchLogs));
    } catch {
      // ignore storage errors
    }
  }, [searchLogs]);

  useEffect(() => {
    try {
      localStorage.setItem('garagem_ia_reports', JSON.stringify(iaReports));
    } catch {
      // ignore storage errors
    }
  }, [iaReports]);

  // Sincronização automática e retroativa: envia relatórios e histórias pendentes para Google Drive/n8n/pasta local
  const syncPendingReportsToCloud = async (isManual = false) => {
    if (!cloudSyncConsent && !isManual) return 0;
    const wsUrl = CURATOR_ENDPOINTS.WORKSPACE_APPS_SCRIPT_URL.trim();
    const n8nUrl = CURATOR_ENDPOINTS.N8N_WEBHOOK_URL.trim();

    let syncedKeys: string[] = [];
    try {
      syncedKeys = JSON.parse(localStorage.getItem('garagem_synced_reports') || '[]');
    } catch {
      syncedKeys = [];
    }
    const syncedSet = new Set(syncedKeys);
    let sentCount = 0;

    // 1. Sincroniza relatórios gerados pela IA salvos no aparelho
    for (const report of iaReports) {
      if (!report) continue;
      const reportKey = `ia-${report.id || report.createdAt}`;
      if (!isManual && syncedSet.has(reportKey)) continue;

      const baseFilename = report.filePath
        ? report.filePath.replace(/^src\/data\/ia_reports\//, '').replace(/\.json$/, '')
        : `report-${new Date(report.createdAt).getTime()}`;

      const txtContent = [
        `RELATÓRIO IA SCANNER - GARAGEM EM MINIATURA (v${pkg.version})`,
        `Arquivo de Destino: src/data/ia_reports/${baseFilename}.txt`,
        `Data: ${new Date(report.createdAt).toLocaleString('pt-BR')}`,
        `Veículo: ${report.detectedVehicleName}`,
        `Status no Acervo: ${
          report.isNewAcquisition
            ? 'Sugestão de Próxima Compra para o Acervo'
            : `Existente no Catálogo (#${report.matchedCarId})`
        }`,
        `------------------------------------------------------------`,
        report.cleanMarkdown
      ].join('\n');

      const payload = {
        filename: baseFilename,
        content: report,
        txtContent,
        imageBase64: null,
        imageMimeType: 'image/jpeg',
        exifStripped: true,
        appVersion: `v${pkg.version}`
      };

      let success = false;

      // Canal local Vite
      try {
        await fetch(`${import.meta.env.BASE_URL}__save_ia_report`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        success = true;
      } catch {}

      // Canal Google Apps Script / Drive
      if (wsUrl) {
        try {
          await fetch(wsUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
          });
          success = true;
        } catch {
          try {
            await fetch(wsUrl, {
              method: 'POST',
              mode: 'no-cors',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify(payload)
            });
            success = true;
          } catch {}
        }
      }

      // Canal n8n
      if (n8nUrl) {
        try {
          await fetch(n8nUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          success = true;
        } catch {}
      }

      if (success) {
        syncedSet.add(reportKey);
        sentCount++;
      }
    }

    // 2. Sincroniza histórias de veículos salvas no catálogo
    for (const storyItem of Object.values(stories)) {
      if (!storyItem?.story) continue;
      const storyKey = `story-${storyItem.carId}-${storyItem.updatedAt || 'init'}`;
      if (!isManual && syncedSet.has(storyKey)) continue;

      const baseFilename = `car-${storyItem.carId}-${storyItem.marca}-${storyItem.modelo}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 48);

      const cleanMd = cleanAiMarkdownText(storyItem.story);
      const entry: IaReportEntry = {
        id: `car-${storyItem.carId}`,
        filePath: `src/data/ia_reports/${baseFilename}.json`,
        createdAt: storyItem.updatedAt || new Date().toISOString(),
        matchedCarId: storyItem.carId,
        isNewAcquisition: false,
        detectedVehicleName: `#${storyItem.carId} ${storyItem.marca} ${storyItem.modelo}`,
        cleanMarkdown: cleanMd
      };

      const txtContent = [
        `RELATÓRIO IA SCANNER - GARAGEM EM MINIATURA (v${pkg.version})`,
        `Arquivo de Destino: src/data/ia_reports/${baseFilename}.txt`,
        `Data: ${new Date(entry.createdAt).toLocaleString('pt-BR')}`,
        `Veículo: ${entry.detectedVehicleName}`,
        `Status no Acervo: Existente no Catálogo (#${storyItem.carId})`,
        `------------------------------------------------------------`,
        cleanMd
      ].join('\n');

      const payload = {
        filename: baseFilename,
        content: entry,
        txtContent,
        imageBase64: null,
        imageMimeType: 'image/jpeg',
        exifStripped: true,
        appVersion: `v${pkg.version}`
      };

      let success = false;

      try {
        await fetch(`${import.meta.env.BASE_URL}__save_ia_report`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        success = true;
      } catch {}

      if (wsUrl) {
        try {
          await fetch(wsUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
          });
          success = true;
        } catch {
          try {
            await fetch(wsUrl, {
              method: 'POST',
              mode: 'no-cors',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify(payload)
            });
            success = true;
          } catch {}
        }
      }

      if (n8nUrl) {
        try {
          await fetch(n8nUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          success = true;
        } catch {}
      }

      if (success) {
        syncedSet.add(storyKey);
        sentCount++;
      }
    }

    try {
      localStorage.setItem('garagem_synced_reports', JSON.stringify(Array.from(syncedSet)));
    } catch {}

    return sentCount;
  };

  useEffect(() => {
    void syncPendingReportsToCloud(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iaReports, stories]);

  useEffect(() => {
    if (selectedCar) {
      const savedOrPending =
        stories[selectedCar.id]?.story || pendingAiStories[selectedCar.id] || '';
      setStoryDraft(savedOrPending ? cleanAiMarkdownText(savedOrPending) : '');
      setIsEditingStory(false);
    }
  }, [selectedCar, stories, pendingAiStories]);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) return;
    const timer = window.setTimeout(() => {
      setSearchLogs((prev) => [
        {
          query: trimmed,
          category: categoryFilter,
          timestamp: new Date().toISOString(),
          type: 'busca' as const
        },
        ...prev.slice(0, 49)
      ]);
    }, 800);
    return () => window.clearTimeout(timer);
  }, [searchQuery, categoryFilter]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedCar(null);
        setAiModalOpen(false);
        setSettingsModalOpen(false);
        setAboutModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const backListener = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (selectedCar || aiModalOpen || settingsModalOpen || aboutModalOpen) {
        setSelectedCar(null);
        setAiModalOpen(false);
        setSettingsModalOpen(false);
        setAboutModalOpen(false);
      } else if (!canGoBack) {
        CapacitorApp.exitApp();
      }
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      backListener.then((h) => h.remove());
    };
  }, [selectedCar, aiModalOpen, settingsModalOpen, aboutModalOpen]);

  const totalMarcas = useMemo(() => {
    const marcas = new Set(
      CARS_DATA.map((c) => c.marca).filter((m) => m && !m.includes('Modelo a Identificar'))
    );
    return marcas.size;
  }, []);

  const filteredCars = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return CARS_DATA.filter((car) => {
      const carStory = stories[car.id]?.story?.toLowerCase() || '';
      const matchText =
        car.modelo.toLowerCase().includes(q) ||
        car.marca.toLowerCase().includes(q) ||
        String(car.ano).includes(q) ||
        `#${car.id}` === q ||
        carStory.includes(q);
      const matchCategory = categoryFilter === 'todos' || car.categoria === categoryFilter;
      return matchText && matchCategory;
    });
  }, [searchQuery, categoryFilter, stories]);

  const similarCars = useMemo(() => {
    if (!selectedCar) return [];
    return CARS_DATA.filter(
      (c) =>
        c.id !== selectedCar.id &&
        (c.marca === selectedCar.marca || c.categoria === selectedCar.categoria)
    ).slice(0, 6);
  }, [selectedCar]);

  // Análise de vínculo da resposta atual da IA
  const aiLinkAnalysis = useMemo(() => {
    if (!aiResult) return null;
    return analyzeCollectionLink(aiResult);
  }, [aiResult]);

  const navigateToCarById = (carId: number) => {
    const targetCar = CARS_DATA.find((c) => c.id === carId);
    if (!targetCar) return;

    setAiModalOpen(false);
    setSettingsModalOpen(false);
    setAboutModalOpen(false);

    setSearchQuery('');
    setCategoryFilter('todos');

    window.setTimeout(() => {
      const cardEl = document.querySelector(`[data-car-id="${carId}"]`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setHighlightedCarId(carId);
      setSelectedCar(targetCar);
      window.setTimeout(() => setHighlightedCarId(null), 2500);
    }, 120);
  };

  // Transforma referências como "#1 . Mercedes-Benz 500SL" ou "#1" em botões clicáveis
  const renderFormattedWithCarLinks = (text: string) => {
    const regex = /#(\d{1,3})(?:\s*[.\-–—:]\s*([^\n,;()]+))?/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const fullMatch = match[0];
      const idNum = Number(match[1]);
      const car = CARS_DATA.find((c) => c.id === idNum);

      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      if (car) {
        const label = `#${car.id} . ${car.marca} ${car.modelo}`;
        parts.push(
          <button
            key={`${match.index}-${car.id}`}
            type="button"
            className="car-ref-link"
            title={`Ir para ${label}`}
            onClick={() => navigateToCarById(car.id)}
          >
            🔗 {fullMatch.includes(car.marca) ? fullMatch.trim() : label}
          </button>
        );
      } else {
        parts.push(fullMatch);
      }

      lastIndex = match.index + fullMatch.length;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  // Processa filhos do ReactMarkdown para tornar "#ID . Marca Modelo" clicáveis
  const processMarkdownChildren = (children: React.ReactNode): React.ReactNode => {
    return React.Children.map(children, (child) => {
      if (typeof child === 'string' && child.includes('#')) {
        return renderFormattedWithCarLinks(child);
      }
      return child;
    });
  };

  const handleVote = (carId: number, type: 'like' | 'dislike', comment = '') => {
    setReactions((prev) => {
      const current = prev[carId] || { likes: 0, dislikes: 0, userChoice: null, comment: '' };
      const updated = { ...current };

      if (type === 'like') {
        if (updated.userChoice === 'like') {
          updated.likes = Math.max(0, updated.likes - 1);
          updated.userChoice = null;
        } else {
          if (updated.userChoice === 'dislike') {
            updated.dislikes = Math.max(0, updated.dislikes - 1);
          }
          updated.likes += 1;
          updated.userChoice = 'like';
        }
      } else if (type === 'dislike') {
        if (updated.userChoice !== 'dislike') {
          if (updated.userChoice === 'like') {
            updated.likes = Math.max(0, updated.likes - 1);
          }
          updated.dislikes += 1;
          updated.userChoice = 'dislike';
        }
        if (comment) updated.comment = comment;
      }

      return { ...prev, [carId]: updated };
    });
  };

  // 2. Intercepta Base64 (sem EXIF/GPS) + Resposta da IA e envia em segundo plano para os 3 canais + pasta local
  const persistIaReportToProjectFolder = async (
    cleanMarkdown: string,
    analysis: { matchedCar: CarItem | null; isNewAcquisition: boolean; detectedName: string },
    interceptedImageBase64?: string | null
  ) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const slug = (
      analysis.matchedCar
        ? `car-${analysis.matchedCar.id}-${analysis.matchedCar.marca}-${analysis.matchedCar.modelo}`
        : analysis.detectedName
    )
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40);

    const baseFilename = `report-${timestamp}-${slug || 'veiculo'}`;
    const filename = `${baseFilename}.json`;
    const filePath = `src/data/ia_reports/${filename}`;

    const entry: IaReportEntry = {
      id: `${Date.now()}`,
      filePath,
      createdAt: new Date().toISOString(),
      matchedCarId: analysis.matchedCar?.id ?? null,
      isNewAcquisition: analysis.isNewAcquisition,
      detectedVehicleName: analysis.matchedCar
        ? `#${analysis.matchedCar.id} ${analysis.matchedCar.marca} ${analysis.matchedCar.modelo}`
        : analysis.detectedName,
      cleanMarkdown
    };

    const txtContent = [
      `RELATÓRIO IA SCANNER - GARAGEM EM MINIATURA (v${pkg.version})`,
      `Arquivo de Destino: src/data/ia_reports/${baseFilename}.txt`,
      `Data: ${new Date(entry.createdAt).toLocaleString('pt-BR')}`,
      `Veículo: ${entry.detectedVehicleName}`,
      `Status no Acervo: ${
        entry.isNewAcquisition
          ? 'Sugestão de Próxima Compra para o Acervo'
          : `Existente no Catálogo (#${entry.matchedCarId})`
      }`,
      `------------------------------------------------------------`,
      entry.cleanMarkdown
    ].join('\n');

    setIaReports((prev) => [entry, ...prev]);
    setLastSavedReport(entry);

    if (!cloudSyncConsent) {
      setSyncStatusMsg('🔒 Modo somente local ativo (sincronização externa desativada pelo usuário).');
      return;
    }

    const payload = {
      filename: baseFilename,
      content: entry,
      txtContent,
      imageBase64: interceptedImageBase64 || null,
      imageMimeType: 'image/jpeg',
      exifStripped: true,
      appVersion: `v${pkg.version}`
    };

    const syncedChannels: string[] = [];

    // Canal 0: Servidor de Desenvolvimento Local (src/data/ia_reports/)
    try {
      const localRes = await fetch(`${import.meta.env.BASE_URL}__save_ia_report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (localRes.ok) syncedChannels.push('Pasta Local');
    } catch {
      // Ambiente estático (GitHub Pages)
    }

    // Canal 1 (No código): Google Workspace / Google Drive (Apps Script Webhook)
    const wsUrl = CURATOR_ENDPOINTS.WORKSPACE_APPS_SCRIPT_URL.trim();
    if (wsUrl) {
      try {
        await fetch(wsUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });
        syncedChannels.push('Google Drive');
      } catch {
        try {
          await fetch(wsUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
          });
          syncedChannels.push('Google Drive');
        } catch {
          // Falha silenciosa de rede
        }
      }
    }

    // Canal 2 (No código): n8n Webhook
    const n8nUrl = CURATOR_ENDPOINTS.N8N_WEBHOOK_URL.trim();
    if (n8nUrl) {
      try {
        await fetch(n8nUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        syncedChannels.push('n8n');
      } catch {
        // Falha silenciosa de rede
      }
    }

    // Canal 3 (No código): GitHub API Direto (repositório andreweua/garagem-miniatura -> src/data/ia_reports/)
    const ghToken = CURATOR_ENDPOINTS.GITHUB_SYNC_TOKEN.trim();
    if (ghToken) {
      try {
        const toBase64Utf8 = (str: string) =>
          window.btoa(unescape(encodeURIComponent(str)));

        await fetch(
          `https://api.github.com/repos/${CURATOR_ENDPOINTS.GITHUB_REPO_OWNER}/${CURATOR_ENDPOINTS.GITHUB_REPO_NAME}/contents/src/data/ia_reports/${baseFilename}.json`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${ghToken}`,
              Accept: 'application/vnd.github+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: `chore(ia-report): ${entry.detectedVehicleName}`,
              content: toBase64Utf8(JSON.stringify(entry, null, 2))
            })
          }
        );

        if (interceptedImageBase64) {
          await fetch(
            `https://api.github.com/repos/${CURATOR_ENDPOINTS.GITHUB_REPO_OWNER}/${CURATOR_ENDPOINTS.GITHUB_REPO_NAME}/contents/src/data/ia_reports/img/${baseFilename}.jpg`,
            {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${ghToken}`,
                Accept: 'application/vnd.github+json',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                message: `chore(ia-photo): foto miniatura ${entry.detectedVehicleName}`,
                content: interceptedImageBase64
              })
            }
          );
        }
        syncedChannels.push('GitHub Repo');
      } catch {
        // Falha silenciosa de rede
      }
    }

    if (syncedChannels.length > 0) {
      setSyncStatusMsg(`☁️ Sincronizado em 2º plano via: ${syncedChannels.join(' + ')}`);
    } else {
      setSyncStatusMsg('💾 Relatório e foto interceptados (salvos localmente no dispositivo).');
    }
  };

  const handleSaveStory = (car: CarItem, customStoryText?: string) => {
    const rawText = (customStoryText ?? storyDraft).trim();
    const formattedText = rawText ? cleanAiMarkdownText(rawText) : '';

    setStories((prev) => {
      if (!formattedText) {
        const copy = { ...prev };
        delete copy[car.id];
        return copy;
      }
      return {
        ...prev,
        [car.id]: {
          carId: car.id,
          marca: car.marca,
          modelo: car.modelo,
          story: formattedText,
          updatedAt: new Date().toISOString()
        }
      };
    });

    setPendingAiStories((prev) => {
      if (!prev[car.id]) return prev;
      const copy = { ...prev };
      delete copy[car.id];
      return copy;
    });

    setStoryDraft(formattedText);
    setIsEditingStory(false);

    if (formattedText) {
      void persistIaReportToProjectFolder(
        formattedText,
        {
          matchedCar: car,
          isNewAcquisition: false,
          detectedName: `${car.marca} ${car.modelo}`
        },
        selectedImageBase64
      );
    }

    alert(`✅ História formatada e salva no card #${car.id} (${car.marca} ${car.modelo}) e em src/data/ia_reports/!`);
  };

  const handleDownloadIaReport = (report: IaReportEntry, ext: 'json' | 'txt' = 'txt') => {
    const content =
      ext === 'json'
        ? JSON.stringify(report, null, 2)
        : [
            `RELATÓRIO IA SCANNER - GARAGEM EM MINIATURA (v${pkg.version})`,
            `Arquivo de Destino: ${report.filePath.replace(/\.json$/, '.txt')}`,
            `Data: ${new Date(report.createdAt).toLocaleString('pt-BR')}`,
            `Veículo: ${report.detectedVehicleName}`,
            `Status no Acervo: ${
              report.isNewAcquisition
                ? 'Sugestão de Próxima Compra para o Acervo'
                : `Existente no Catálogo (#${report.matchedCarId})`
            }`,
            `------------------------------------------------------------`,
            report.cleanMarkdown
          ].join('\n');

    const blob = new Blob([content], {
      type: ext === 'json' ? 'application/json;charset=utf-8' : 'text/plain;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const baseName = report.filePath.split('/').pop()?.replace(/\.json$/, '') || 'ia-report';
    link.download = `${baseName}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSendCopyToDeveloper = (mode: 'file-and-email' | 'json-only' = 'file-and-email') => {
    const editedStories = Object.values(stories);
    const votedItems = Object.entries(reactions)
      .filter(([, r]) => r.likes > 0 || r.dislikes > 0 || r.comment)
      .map(([id, r]) => {
        const car = CARS_DATA.find((c) => c.id === Number(id));
        return {
          id: Number(id),
          veiculo: car ? `${car.marca} ${car.modelo}` : `#${id}`,
          ...r
        };
      });

    const compiledData = {
      app: 'Garagem em Miniatura',
      version: `v${pkg.version}`,
      generatedAt: new Date().toISOString(),
      editedStories,
      iaReportsDirectory: 'src/data/ia_reports/',
      iaReports,
      reactions: votedItems,
      recentSearches: searchLogs
    };

    const txtLines = [
      `=========================================================`,
      `GARAGEM EM MINIATURA (v${pkg.version}) - COMPILADO DE EDIÇÕES`,
      `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
      `=========================================================`,
      ``,
      `1. HISTÓRIAS / DESCRIÇÕES EDITADAS (${editedStories.length}):`,
      editedStories.length === 0
        ? 'Nenhuma história editada até o momento.'
        : editedStories
            .map(
              (s) =>
                `- #${s.carId} . ${s.marca} ${s.modelo} (Atualizado em ${new Date(
                  s.updatedAt
                ).toLocaleString('pt-BR')}):\n  "${s.story}"`
            )
            .join('\n\n'),
      ``,
      `2. RELATÓRIOS IA SALVOS EM src/data/ia_reports/ (${iaReports.length}):`,
      iaReports.length === 0
        ? 'Nenhum relatório IA gerado.'
        : iaReports
            .map(
              (r) =>
                `- [${r.filePath}] ${r.detectedVehicleName}:\n  ${r.cleanMarkdown.replace(
                  /\n/g,
                  '\n  '
                )}`
            )
            .join('\n\n'),
      ``,
      `3. REAÇÕES E COMENTÁRIOS (${votedItems.length}):`,
      votedItems.length === 0
        ? 'Nenhuma reação registrada.'
        : votedItems
            .map(
              (v) =>
                `- #${v.id} . ${v.veiculo}: 👍 ${v.likes} | 👎 ${v.dislikes}${
                  v.comment ? ` | Comentário: "${v.comment}"` : ''
                }`
            )
            .join('\n'),
      ``,
      `4. HISTÓRICO DE PESQUISAS E SCANNER IA (${searchLogs.length}):`,
      searchLogs.length === 0
        ? 'Nenhuma pesquisa registrada.'
        : searchLogs
            .map(
              (l) =>
                `- [${l.type.toUpperCase()}] "${l.query}" (Categoria: ${
                  l.category
                }) em ${new Date(l.timestamp).toLocaleString('pt-BR')}`
            )
            .join('\n')
    ].join('\n');

    const isJson = mode === 'json-only';
    const blob = new Blob([isJson ? JSON.stringify(compiledData, null, 2) : txtLines], {
      type: isJson ? 'application/json;charset=utf-8' : 'text/plain;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `garagem-miniatura-compilado-v${pkg.version}.${isJson ? 'json' : 'txt'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (mode === 'file-and-email') {
      const subject = encodeURIComponent(
        `[Garagem em Miniatura v${pkg.version}] Compilado de Histórias e Correções`
      );
      const body = encodeURIComponent(txtLines.slice(0, 1800));
      window.open(`mailto:${DEV_EMAIL}?subject=${subject}&body=${body}`, '_blank');
    }
  };

  const handleSendDislikeWhatsApp = (car: CarItem) => {
    const currentComment = dislikeDrafts[car.id] ?? reactions[car.id]?.comment ?? '';
    const comentario = currentComment.trim();
    if (!comentario) {
      alert('Por favor, digite sua opinião antes de enviar!');
      return;
    }

    handleVote(car.id, 'dislike', comentario);
    setOpenDislikeId(null);

    const msg =
      `*Feedback Coleção de Carrinhos*\n` +
      `🏎️ *Item:* #${car.id} - ${car.marca} ${car.modelo} (${car.ano})\n` +
      `💬 *Opinião:* "${comentario}"\n\n` +
      `🔗 *Acesse o catálogo:* https://andreweua.github.io/garagem-miniatura/`;

    window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleSaveSettings = () => {
    const trimmedKey = apiKey.trim();
    if (trimmedKey) {
      localStorage.setItem('gemini_api_key', trimmedKey);
    } else {
      localStorage.removeItem('gemini_api_key');
    }
    localStorage.setItem('garagem_cloud_consent', String(cloudSyncConsent));
    alert('✅ Chave da API Google Gemini salva com sucesso nas Configurações!');
    setSettingsModalOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const fullDataUrl = String(event.target?.result || '');
      setSelectedImagePreview(fullDataUrl);
      // Comprime para máx 800px e remove 100% dos metadados EXIF/GPS (conformidade LGPD / Play Store / App Store)
      const strippedCompressedBase64 = await compressAndStripExifBase64(fullDataUrl, 800);
      setSelectedImageMime('image/jpeg');
      setSelectedImageBase64(strippedCompressedBase64);
      setAiResult(null);
      setAiError(null);
      setLastSavedReport(null);
      setSyncStatusMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeAi = async () => {
    const key = (apiKey || localStorage.getItem('gemini_api_key') || '').trim();
    if (!key) {
      alert(
        '🔑 Chave da API não configurada!\n\nPara usar o IA Scanner, abra o menu "⚙️ Configurações" no topo do app, cole sua chave do Google AI Studio e clique em "Salvar Configurações".'
      );
      setAiModalOpen(false);
      setSettingsModalOpen(true);
      return;
    }
    if (!selectedImageBase64) {
      alert('Por favor, selecione ou tire uma foto primeiro.');
      return;
    }

    setAiLoading(true);
    setAiError(null);
    setAiResult(null);
    setLastSavedReport(null);
    setSyncStatusMsg(null);

    setSearchLogs((prev) => [
      {
        query: 'Análise de Imagem via IA Scanner',
        category: categoryFilter,
        timestamp: new Date().toISOString(),
        type: 'ia-scanner' as const
      },
      ...prev.slice(0, 49)
    ]);

    const prompt = `Você é um curador especialista em réplicas de automóveis e miniaturas.
Analise detalhadamente a foto desta miniatura e compare com a lista dos ${CARS_DATA.length} veículos deste acervo:
${CARS_DATA.map((c) => `#${c.id} . ${c.marca} ${c.modelo} (${c.ano})`).join('; ')}

Responda em português usando Markdown limpo (sem blocos de código \`\`\`, sem repetir parágrafos), estruturado exatamente em:
- **Veículo Identificado:** Marca, Modelo, Ano aproximado e Categoria.
- **História e Curiosidades:** Breve histórico automotivo do modelo real e detalhes da miniatura.
- **Status no Acervo:** Se já existir na lista acima, cite no formato exato "#ID . Marca Modelo" (ex.: "#1 . Mercedes-Benz 500 SL"). Se não existir no catálogo, escreva explicitamente "Possível Nova Aquisição" e liste até 2 modelos similares do acervo usando "#ID . Marca Modelo".`;

    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const interaction = await ai.interactions.create({
        model: 'gemini-3.8-flash',
        input: [
          { type: 'text', text: prompt },
          {
            type: 'image',
            data: selectedImageBase64,
            mime_type: selectedImageMime as
              | 'image/jpeg'
              | 'image/png'
              | 'image/webp'
              | 'image/heic'
              | 'image/heif'
          }
        ]
      });

      const interactionRecord = interaction as unknown as {
        output_text?: string;
        outputs?: Array<{ type?: string; text?: string }>;
      };
      const rawResponse =
        interactionRecord.output_text ||
        interactionRecord.outputs?.find((o) => o.type === 'text')?.text;

      if (!rawResponse) {
        throw new Error('A IA não gerou candidatos de resposta.');
      }

      // Já formata o resultado assim que chega e prepara para o usuário apenas salvar
      const cleanedMarkdown = cleanAiMarkdownText(rawResponse);
      setAiResult(cleanedMarkdown);

      const linkAnalysis = analyzeCollectionLink(cleanedMarkdown);
      if (linkAnalysis.matchedCar) {
        const matchedId = linkAnalysis.matchedCar.id;
        setPendingAiStories((prev) => ({
          ...prev,
          [matchedId]: cleanedMarkdown
        }));
      }

      // Intercepta Base64 (sem EXIF/GPS) + Resposta da IA e sincroniza em 2º plano
      await persistIaReportToProjectFolder(
        cleanedMarkdown,
        linkAnalysis,
        selectedImageBase64
      );
    } catch (err) {
      setAiError(err instanceof Error ? err.message : String(err));
    } finally {
      setAiLoading(false);
    }
  };

  const hasSavedKey = Boolean(apiKey.trim());

  return (
    <>
      <header className="header">
        <div className="container header-container">
          <div className="logo">
            <span className="logo-icon">🏎️</span>
            <span className="logo-text">
              Garagem<span>Miniatura</span>
            </span>
            <span className="version-tag">v{pkg.version}</span>
          </div>

          <button
            className={`menu-toggle ${menuOpen ? 'active' : ''}`}
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </button>

          <nav className={`nav ${menuOpen ? 'active' : ''}`}>
            <a href="#catalogo" className="nav-link" onClick={() => setMenuOpen(false)}>
              Catálogo
            </a>
            <a href="#estatisticas" className="nav-link" onClick={() => setMenuOpen(false)}>
              Estatísticas
            </a>
            <button
              type="button"
              className="nav-btn-link"
              onClick={() => {
                setMenuOpen(false);
                setAiModalOpen(true);
              }}
            >
              🤖 IA Scanner
            </button>
            <button
              type="button"
              className="nav-btn-link"
              onClick={() => {
                setMenuOpen(false);
                setSettingsModalOpen(true);
              }}
            >
              ⚙️ Configurações
            </button>
            <button
              type="button"
              className="nav-btn-link"
              onClick={() => {
                setMenuOpen(false);
                setAboutModalOpen(true);
              }}
            >
              📖 Sobre o Projeto
            </button>
            <button
              type="button"
              className="nav-btn-link"
              aria-label="Alternar tema claro ou escuro"
              onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
            >
              {theme === 'dark' ? '☀️ Tema Claro' : '🌙 Tema Escuro'}
            </button>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="container hero-content">
          <span className="badge">Coleção Particular • by PereiraLabs</span>
          <h1>Acervo de Veículos em Miniatura</h1>
          <p>
            Catálogo interativo reunindo clássicos, muscle cars, modelos nacionais e
            superesportivos.
          </p>

          <div className="stats-bar" id="estatisticas">
            <div className="stat-card">
              <span className="stat-num">{CARS_DATA.length}</span>
              <span className="stat-label">Modelos Catalogados</span>
            </div>
            <div className="stat-card">
              <span className="stat-num">{totalMarcas}</span>
              <span className="stat-label">Marcas Presentes</span>
            </div>
            <div className="stat-card">
              <span className="stat-num">1929 – 2019</span>
              <span className="stat-label">Período Histórico</span>
            </div>
            <button
              type="button"
              className="stat-card stat-card-ai"
              onClick={() => setAiModalOpen(true)}
            >
              <span className="stat-num">🤖 IA</span>
              <span className="stat-label stat-label-highlight">Identificar com IA ➔</span>
            </button>
          </div>
        </div>
      </section>

      <section className="catalog-section" id="catalogo">
        <div className="container">
          <div className="filter-controls">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="search"
                inputMode="search"
                enterKeyHint="search"
                placeholder="Buscar por marca, modelo, ano ou história..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="categories-pills">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  className={`pill ${categoryFilter === cat.value ? 'active' : ''}`}
                  onClick={() => setCategoryFilter(cat.value)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="search-results-container">
            {filteredCars.length === 0 ? (
              <div className="no-results">
                <p>Nenhuma miniatura encontrada com esses termos de busca.</p>
              </div>
            ) : (
              <div className="grid">
                {filteredCars.map((car) => {
                  const carReaction = reactions[car.id] || {
                    likes: 0,
                    dislikes: 0,
                    userChoice: null,
                    comment: ''
                  };
                  const carStory = stories[car.id]?.story;
                  const isDislikeBoxOpen = openDislikeId === car.id;

                  return (
                    <article
                      key={car.id}
                      data-car-id={car.id}
                      className={`car-card ${
                        highlightedCarId === car.id ? 'highlight-pulse' : ''
                      }`}
                    >
                      <div
                        className="card-image"
                        role="button"
                        tabIndex={0}
                        aria-label={`Ver detalhes de ${car.modelo}`}
                        onClick={() => setSelectedCar(car)}
                      >
                        <CarImage car={car} />
                      </div>

                      <div className="card-content">
                        <div
                          className="card-clickable"
                          role="button"
                          tabIndex={0}
                          aria-label={`Ver detalhes de ${car.modelo}`}
                          onClick={() => setSelectedCar(car)}
                        >
                          <div className="card-brand">{car.marca}</div>
                          <h2 className="card-title">{car.modelo}</h2>
                          {carStory && (
                            <p className="card-story-preview">
                              📝 {stripMarkdownPreview(carStory)}
                            </p>
                          )}
                        </div>

                        <div className="card-footer">
                          <div className="card-tags">
                            <span className="card-badge">{car.categoria}</span>
                            {car.ano !== '—' && <span className="card-year">{car.ano}</span>}
                            {car.escala && <span className="card-year">📏 {car.escala}</span>}
                          </div>
                          <span className="card-id">#{car.id}</span>
                        </div>

                        <div className="card-actions">
                          <div className="feedback-btns">
                            <button
                              type="button"
                              className={`btn-feedback btn-like ${
                                carReaction.userChoice === 'like' ? 'liked' : ''
                              }`}
                              onClick={() => handleVote(car.id, 'like')}
                            >
                              👍 <span>{carReaction.likes}</span>
                            </button>
                            <button
                              type="button"
                              className={`btn-feedback btn-dislike ${
                                carReaction.userChoice === 'dislike' ? 'disliked' : ''
                              }`}
                              onClick={() =>
                                setOpenDislikeId(isDislikeBoxOpen ? null : car.id)
                              }
                            >
                              👎 <span>{carReaction.dislikes}</span>
                            </button>
                          </div>
                        </div>

                        {isDislikeBoxOpen && (
                          <div className="dislike-box">
                            <textarea
                              placeholder="O que achou deste modelo? (opinião curta)..."
                              value={dislikeDrafts[car.id] ?? carReaction.comment ?? ''}
                              onChange={(e) =>
                                setDislikeDrafts((prev) => ({
                                  ...prev,
                                  [car.id]: e.target.value
                                }))
                              }
                            />
                            <div className="dislike-box-actions">
                              <button
                                type="button"
                                className="btn-mini btn-mini-cancel"
                                onClick={() => setOpenDislikeId(null)}
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                className="btn-mini btn-mini-send"
                                onClick={() => handleSendDislikeWhatsApp(car)}
                              >
                                Enviar no WhatsApp
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* MODAL DETALHES DO CARRO + HISTÓRIA FORMATADA + SIMILARES */}
      {selectedCar && (
        <div className="modal-overlay" onClick={() => setSelectedCar(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-btn"
              aria-label="Fechar"
              onClick={() => setSelectedCar(null)}
            >
              &times;
            </button>
            <div className="modal-body">
              <div className="modal-image-wrapper">
                <CarImage car={selectedCar} className="modal-img" />
              </div>
              <h2>
                {selectedCar.marca} {selectedCar.modelo}
              </h2>
              <div className="detail-row">
                <span>Número no Acervo:</span> <strong>#{selectedCar.id}</strong>
              </div>
              <div className="detail-row">
                <span>Ano de Fabricação:</span> <strong>{selectedCar.ano}</strong>
              </div>
              <div className="detail-row">
                <span>Categoria:</span> <strong>{selectedCar.categoria}</strong>
              </div>
              <div className="detail-row">
                <span>Fabricante da Miniatura:</span>{' '}
                <strong>{selectedCar.fabricante}</strong>
              </div>
              {selectedCar.escala && (
                <div className="detail-row">
                  <span>Escala da Miniatura:</span>{' '}
                  <strong>{selectedCar.escala}</strong>
                </div>
              )}
              {selectedCar.precoCompra && (
                <div className="detail-row">
                  <span>Preço de Compra:</span>{' '}
                  <strong style={{ color: '#4ade80' }}>{selectedCar.precoCompra}</strong>
                </div>
              )}

              <div className="story-section">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '10px',
                    flexWrap: 'wrap'
                  }}
                >
                  <h3 style={{ margin: 0 }}>📖 História / Descrição da Miniatura</h3>
                  {storyDraft.trim() && (
                    <button
                      type="button"
                      className="btn-mini btn-mini-cancel"
                      onClick={() => {
                        if (isEditingStory) {
                          setStoryDraft((prev) => cleanAiMarkdownText(prev));
                          setIsEditingStory(false);
                        } else {
                          setIsEditingStory(true);
                        }
                      }}
                    >
                      {isEditingStory ? '✨ Ver Formatado' : '✏️ Editar Texto'}
                    </button>
                  )}
                </div>

                {/* Exibe APENAS o texto formatado quando há conteúdo e não está em edição manual (sem duplicar com textarea) */}
                {storyDraft.trim() && !isEditingStory ? (
                  <>
                    <div className="ai-result ai-markdown-body" style={{ marginTop: 0 }}>
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p>{processMarkdownChildren(children)}</p>,
                          li: ({ children }) => <li>{processMarkdownChildren(children)}</li>
                        }}
                      >
                        {storyDraft}
                      </ReactMarkdown>
                    </div>
                    <div className="ia-report-meta" style={{ marginTop: '8px' }}>
                      {stories[selectedCar.id]?.story === storyDraft.trim() ? (
                        <span>
                          ✅ Salvo no card #{selectedCar.id} e enviado para{' '}
                          <code>src/data/ia_reports/</code>
                        </span>
                      ) : (
                        <span>
                          ✨ Texto já formatado — clique em{' '}
                          <strong>Salvar História</strong> para gravar no card
                        </span>
                      )}
                      <button
                        type="button"
                        className="btn-mini btn-mini-cancel"
                        onClick={() =>
                          handleDownloadIaReport(
                            {
                              id: `car-${selectedCar.id}`,
                              filePath: `src/data/ia_reports/car-${selectedCar.id}-${selectedCar.marca
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, '-')}.json`,
                              createdAt:
                                stories[selectedCar.id]?.updatedAt ||
                                new Date().toISOString(),
                              matchedCarId: selectedCar.id,
                              isNewAcquisition: false,
                              detectedVehicleName: `#${selectedCar.id} ${selectedCar.marca} ${selectedCar.modelo}`,
                              cleanMarkdown: storyDraft
                            },
                            'txt'
                          )
                        }
                      >
                        ⬇️ Baixar .txt
                      </button>
                    </div>
                  </>
                ) : (
                  <textarea
                    className="story-textarea"
                    placeholder="Adicione curiosidades, estado de conservação, história do modelo ou referências (ex.: #1 . Mercedes-Benz 500 SL)..."
                    value={storyDraft}
                    onChange={(e) => setStoryDraft(e.target.value)}
                  />
                )}

                <div className="story-actions">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => handleSaveStory(selectedCar)}
                  >
                    💾 Salvar História
                  </button>
                  <button
                    type="button"
                    className="btn-dev-report"
                    onClick={() => handleSendCopyToDeveloper('file-and-email')}
                  >
                    📤 Enviar Cópia para o Desenvolvedor
                  </button>
                </div>
              </div>

              {similarCars.length > 0 && (
                <div className="similar-section">
                  <h3>🔗 Miniaturas Similares no Acervo</h3>
                  <div className="similar-links">
                    {similarCars.map((sim) => (
                      <button
                        key={sim.id}
                        type="button"
                        className="car-ref-link"
                        onClick={() => navigateToCarById(sim.id)}
                      >
                        #{sim.id} . {sim.marca} {sim.modelo}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DA IA (CLEAN UI MARKDOWN + SALVAMENTO EM PASTA + VÍNCULO DE COLEÇÃO) */}
      {aiModalOpen && (
        <div className="modal-overlay" onClick={() => setAiModalOpen(false)}>
          <div
            className="modal-content modal-ai-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-btn"
              aria-label="Fechar"
              onClick={() => setAiModalOpen(false)}
            >
              &times;
            </button>
            <div className="ai-modal-header">
              <span className="ai-badge">Google Gemini 3.8 Flash</span>
              <h2>🔍 Comparador com o Acervo</h2>
              <p>Tire uma foto ou carregue um arquivo para comparar com a coleção.</p>
            </div>

            {!hasSavedKey && (
              <div className="key-warning-banner">
                <span>
                  ⚠️ <strong>Chave da API não encontrada:</strong> Para usar o Scanner IA,
                  salve sua chave do Google Gemini no menu de Configurações.
                </span>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setAiModalOpen(false);
                    setSettingsModalOpen(true);
                  }}
                >
                  ⚙️ Abrir Configurações para Salvar Chave
                </button>
              </div>
            )}

            <div className="ai-modal-controls">
              <div className="upload-area">
                <input
                  type="file"
                  id="ai-file-input"
                  accept="image/*"
                  capture="environment"
                  className="file-input-hidden"
                  onChange={handleFileChange}
                />
                <label htmlFor="ai-file-input" className="btn-primary">
                  📸 Tirar Foto / Carregar Arquivo
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                    textAlign: 'left',
                    maxWidth: '460px',
                    marginTop: '6px',
                    cursor: 'pointer',
                    lineHeight: 1.4
                  }}
                >
                  <input
                    type="checkbox"
                    checked={cloudSyncConsent}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setCloudSyncConsent(checked);
                      localStorage.setItem('garagem_cloud_consent', String(checked));
                    }}
                    style={{ marginTop: '2px' }}
                  />
                  <span>
                    <strong>Contribuir com o Acervo PereiraLabs:</strong> Autorizo o envio da
                    foto da miniatura (com remoção automática de GPS/EXIF) e da análise
                    técnica para curadoria e atualização do catálogo.
                  </span>
                </label>

                {selectedImagePreview && (
                  <div className="ai-preview">
                    <img src={selectedImagePreview} alt="Prévia" />
                    <button
                      type="button"
                      className="btn-accent"
                      disabled={aiLoading}
                      onClick={handleAnalyzeAi}
                    >
                      {aiLoading ? 'Analisando...' : 'Analisar com IA'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {aiLoading && (
              <div className="ai-status">⏳ Analisando com gemini-3.8-flash...</div>
            )}
            {aiError && (
              <div className="ai-status error">
                <strong>❌ Erro no Scanner:</strong>
                <br />
                {aiError}
              </div>
            )}

            {aiResult && (
              <>
                {/* 1. Formatação Amigável (Clean UI) com ReactMarkdown */}
                <div className="ai-result ai-markdown-body">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p>{processMarkdownChildren(children)}</p>,
                      li: ({ children }) => <li>{processMarkdownChildren(children)}</li>
                    }}
                  >
                    {aiResult}
                  </ReactMarkdown>
                </div>

                {/* 2. Confirmação de Salvamento em src/data/ia_reports/ + Status dos 3 Canais */}
                {lastSavedReport && (
                  <div className="ia-report-meta">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span>
                        📁 Salvo em: <code>{lastSavedReport.filePath}</code>
                      </span>
                      {syncStatusMsg && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {syncStatusMsg}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn-mini btn-mini-cancel"
                      onClick={() => handleDownloadIaReport(lastSavedReport, 'txt')}
                    >
                      ⬇️ Baixar .txt
                    </button>
                  </div>
                )}

                {/* 3. Inteligência de Vínculo de Coleção */}
                {aiLinkAnalysis?.matchedCar ? (
                  <div className="collection-match-card">
                    <div className="collection-match-header">
                      <span>
                        ✅ Veículo identificado no acervo: #
                        {aiLinkAnalysis.matchedCar.id} .{' '}
                        {aiLinkAnalysis.matchedCar.marca}{' '}
                        {aiLinkAnalysis.matchedCar.modelo}
                      </span>
                    </div>
                    {!stories[aiLinkAnalysis.matchedCar.id]?.story ? (
                      <button
                        type="button"
                        className="btn-save-card-story"
                        onClick={() => {
                          const target = aiLinkAnalysis.matchedCar!;
                          handleSaveStory(target, aiResult);
                          navigateToCarById(target.id);
                        }}
                      >
                        💾 Salvar História no Card do Veículo
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-save-card-story"
                        onClick={() => {
                          const target = aiLinkAnalysis.matchedCar!;
                          handleSaveStory(target, aiResult);
                          navigateToCarById(target.id);
                        }}
                      >
                        🔄 Salvar História no Card do Veículo (Atualizar)
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="recommendation-card">
                    <span className="wishlist-badge">🌟 Lista de Desejos • Inédito</span>
                    <div className="recommendation-title">
                      Sugestão de Próxima Compra para o Acervo
                    </div>
                    <p className="recommendation-desc">
                      Este modelo ({aiLinkAnalysis?.detectedName || 'analisado'}) ainda não
                      consta entre os {CARS_DATA.length} carrinhos catalogados e foi
                      registrado no histórico de relatórios (
                      <code>src/data/ia_reports/</code>) como recomendação de aquisição.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE CONFIGURAÇÕES */}
      {settingsModalOpen && (
        <div className="modal-overlay" onClick={() => setSettingsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-btn"
              aria-label="Fechar"
              onClick={() => setSettingsModalOpen(false)}
            >
              &times;
            </button>
            <div className="about-header">
              <span className="badge">Preferências do Aplicativo</span>
              <h2>⚙️ Configurações</h2>
              <p className="app-subtitle">Gerenciamento de Chave de API, Tema e Backup</p>
            </div>

            <div className="about-body">
              <h3>🔑 Chave da API Google Gemini</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Insira sua chave do Google AI Studio para habilitar o reconhecimento de
                miniaturas com o modelo <code>gemini-3.8-flash</code>.
              </p>
              <div className="key-container">
                <input
                  type="password"
                  placeholder="Cole sua Chave da API Google AI..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <button type="button" className="btn-primary" onClick={handleSaveSettings}>
                  Salvar Chave
                </button>
              </div>

              <div className="story-section">
                <h3>📤 Exportação Manual e Envio para o Desenvolvedor</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  Gere um arquivo estruturado com todas as histórias editadas (
                  {Object.keys(stories).length}), relatórios IA ({iaReports.length}) e
                  pesquisas realizadas ({searchLogs.length}) ou envie por e-mail para análise.
                </p>
                <div className="story-actions">
                  <button
                    type="button"
                    className="btn-dev-report"
                    onClick={() => handleSendCopyToDeveloper('file-and-email')}
                  >
                    📤 Enviar Cópia para o Desenvolvedor (.txt + E-mail)
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => handleSendCopyToDeveloper('json-only')}
                  >
                    ⬇️ Baixar JSON
                  </button>
                </div>

                <div style={{ marginTop: '12px' }}>
                  <button
                    type="button"
                    className="btn-accent"
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    disabled={isSyncingPending}
                    onClick={async () => {
                      setIsSyncingPending(true);
                      try {
                        const count = await syncPendingReportsToCloud(true);
                        if (count > 0) {
                          alert(`✅ ${count} relatório(s) sincronizado(s) com sucesso no Google Drive!`);
                        } else {
                          alert('ℹ️ Todos os relatórios do aparelho já foram sincronizados com o Google Drive!');
                        }
                      } finally {
                        setIsSyncingPending(false);
                      }
                    }}
                  >
                    {isSyncingPending
                      ? '⏳ Sincronizando com o Google Drive...'
                      : '☁️ Sincronizar Relatórios Pendentes com Google Drive'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SOBRE & POLÍTICA DE PRIVACIDADE (GOOGLE PLAY / APP STORE / LGPD) */}
      {aboutModalOpen && (
        <div className="modal-overlay" onClick={() => setAboutModalOpen(false)}>
          <div
            className="modal-content modal-about-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-btn"
              aria-label="Fechar"
              onClick={() => setAboutModalOpen(false)}
            >
              &times;
            </button>
            <div className="about-header">
              <span className="badge">Documentação Técnica</span>
              <h2>🏎️ Garagem em Miniatura</h2>
              <p className="app-subtitle">Controlador da Aplicação v{pkg.version}</p>
            </div>
            <div className="about-body">
              <h3>📋 Visão Geral</h3>
              <p>
                Catalogação e curadoria interativa de 105 réplicas automotivas em
                miniatura com suporte offline (PWA) e empacotamento nativo Android/iOS via
                Capacitor.
              </p>
              <br />
              <h3>🔒 Política de Privacidade &amp; Conformidade (Google Play / App Store / LGPD)</h3>
              <p style={{ fontSize: '0.88rem', lineHeight: 1.55 }}>
                • <strong>Coleta Voluntária e Transparente:</strong> As imagens capturadas no
                Scanner IA destinam-se exclusivamente à identificação de miniaturas
                automotivas via Google Gemini e, mediante consentimento ativo do usuário, à
                curadoria colaborativa do acervo <em>Garagem em Miniatura</em>.<br />
                • <strong>Remoção Automática de Metadados (EXIF/GPS Strip):</strong> Antes de
                qualquer análise ou envio para curadoria, o aplicativo redesenha a imagem em
                memória removendo 100% dos metadados EXIF ocultos (incluindo coordenadas GPS,
                identificação do aparelho e data/hora).<br />
                • <strong>Sem Rastreamento Pessoal:</strong> O aplicativo não coleta dados
                pessoais sensíveis, contatos, localização geográfica nem realiza capturas em
                segundo plano sem ação direta do usuário.
              </p>
              <br />
              <h3>🏢 PereiraLabs</h3>
              <p>
                Divisão de Tecnologia e IA
                <br />
                Louzada &amp; Pereira - Soluções Digitais
                <br />
                <a
                  href="https://github.com/andreweua/garagem-miniatura"
                  target="_blank"
                  rel="noreferrer"
                >
                  github.com/andreweua/garagem-miniatura
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      <footer className="footer" id="sobre">
        <div className="container footer-content">
          <div className="footer-brand">
            <h3>Garagem em Miniatura</h3>
            <p className="app-subtitle">Controlador da Aplicação v{pkg.version}</p>
            <p className="collection-desc">
              Organização, catalogação interativa e preservação histórica de acervo de
              veículos em miniatura.
            </p>
          </div>

          <div className="footer-credits">
            <span className="developed-by">Desenvolvido por:</span>
            <strong className="lab-name">PereiraLabs</strong>
            <span className="lab-role">Divisão de Tecnologia e IA</span>
            <span className="parent-company">Louzada &amp; Pereira - Soluções Digitais</span>
          </div>

          <div className="footer-bottom">
            <small>© Garagem em Miniatura. Hospedado via GitHub Pages.</small>
          </div>
        </div>
      </footer>
    </>
  );
}
