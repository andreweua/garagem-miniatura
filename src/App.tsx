import { useState, useEffect, useMemo } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { GoogleGenAI } from '@google/genai';
import pkg from '../package.json';
import { CARS_DATA } from './data/cars';
import type {
  CarItem,
  CarCategory,
  ReactionsMap,
  StoriesMap,
  SearchLogEntry
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
    return raw ? JSON.parse(raw) : {};
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
  // 1. Estado de Tema Claro/Escuro persistido no localStorage e injetado no body
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('garagem_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CarCategory>('todos');
  const [reactions, setReactions] = useState<ReactionsMap>(loadReactions);
  const [stories, setStories] = useState<StoriesMap>(loadStories);
  const [searchLogs, setSearchLogs] = useState<SearchLogEntry[]>(loadSearchLogs);
  const [storyDraft, setStoryDraft] = useState('');
  const [openDislikeId, setOpenDislikeId] = useState<number | null>(null);
  const [dislikeDrafts, setDislikeDrafts] = useState<Record<number, string>>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [highlightedCarId, setHighlightedCarId] = useState<number | null>(null);

  // Modais
  const [selectedCar, setSelectedCar] = useState<CarItem | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);

  // Estado IA Scanner & Chave Inteligente
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [selectedImageMime, setSelectedImageMime] = useState('image/jpeg');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<string | null>(null);

  // Sincroniza classe do tema no body e salva no localStorage
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

  // Atualiza rascunho da história ao abrir modal de um carrinho
  useEffect(() => {
    if (selectedCar) {
      setStoryDraft(stories[selectedCar.id]?.story || '');
    }
  }, [selectedCar, stories]);

  // Registra buscas relevantes no histórico local
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

  // Suporte ao botão voltar físico no Android (Capacitor) e tecla Escape na Web
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

  // 4. Navegação inteligente: rola até o card da miniatura e abre o modal correspondente
  const navigateToCarById = (carId: number) => {
    const targetCar = CARS_DATA.find((c) => c.id === carId);
    if (!targetCar) return;

    setAiModalOpen(false);
    setSettingsModalOpen(false);
    setAboutModalOpen(false);

    // Garante que o filtro exiba o carro caso esteja filtrado
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

  // Transforma referências como "#1 . Mercedes-Benz 500SL" ou "#1" em links clicáveis
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

  const handleSaveStory = (car: CarItem) => {
    const trimmed = storyDraft.trim();
    setStories((prev) => {
      if (!trimmed) {
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
          story: trimmed,
          updatedAt: new Date().toISOString()
        }
      };
    });
    alert(`História da miniatura #${car.id} (${car.marca} ${car.modelo}) salva localmente!`);
  };

  // 5. Gera compilado (.txt / .json) e abre e-mail para o desenvolvedor
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
      `2. REAÇÕES E COMENTÁRIOS (${votedItems.length}):`,
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
      `3. HISTÓRICO DE PESQUISAS E SCANNER IA (${searchLogs.length}):`,
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

    // Download automático do arquivo compilado
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

  const handleSaveKey = () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      localStorage.removeItem('gemini_api_key');
      alert('Chave da API removida das configurações.');
      return;
    }
    localStorage.setItem('gemini_api_key', trimmed);
    alert('✅ Chave da API Google Gemini salva com sucesso nas Configurações!');
    setSettingsModalOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImageMime(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = (event) => {
      const fullBase64 = String(event.target?.result || '');
      setSelectedImagePreview(fullBase64);
      setSelectedImageBase64(fullBase64.split(',')[1] || null);
      setAiResult(null);
      setAiError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeAi = async () => {
    const key = (apiKey || localStorage.getItem('gemini_api_key') || '').trim();
    if (!key) {
      alert(
        '🔑 Chave da API não configurada!\n\nPara usar o IA Scanner, abra o menu "⚙️ Configurações" no topo do app, cole sua chave do Google AI Studio e clique em "Salvar Chave".'
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

Responda em português de forma clara e estruturada:
1. Marca, Modelo e Categoria mais prováveis do veículo na foto.
2. Este modelo já existe na lista acima? Se sim, cite no formato exato "#ID . Marca Modelo" (ex.: "#1 . Mercedes-Benz 500 SL"). Se não existir, declare como 'Possível Nova Aquisição' e liste até 3 miniaturas similares do acervo usando também o formato "#ID . Marca Modelo".`;

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
      const textoResposta =
        interactionRecord.output_text ||
        interactionRecord.outputs?.find((o) => o.type === 'text')?.text;

      if (!textoResposta) {
        throw new Error('A IA não gerou candidatos de resposta.');
      }
      setAiResult(textoResposta);
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
                            <p className="card-story-preview">📝 {carStory}</p>
                          )}
                        </div>

                        <div className="card-footer">
                          <div className="card-tags">
                            <span className="card-badge">{car.categoria}</span>
                            {car.ano !== '—' && <span className="card-year">{car.ano}</span>}
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

      {/* MODAL DETALHES DO CARRO + HISTÓRIA EDITÁVEL + SIMILARES */}
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

              {/* 5. Persistência de História Editável e Envio */}
              <div className="story-section">
                <h3>📖 História / Descrição da Miniatura</h3>
                <textarea
                  className="story-textarea"
                  placeholder="Adicione curiosidades, estado de conservação, história do modelo ou referências (ex.: #1 . Mercedes-Benz 500 SL)..."
                  value={storyDraft}
                  onChange={(e) => setStoryDraft(e.target.value)}
                />
                {storyDraft.includes('#') && (
                  <div style={{ marginTop: '6px', fontSize: '0.82rem' }}>
                    {renderFormattedWithCarLinks(storyDraft)}
                  </div>
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

              {/* 4. Links Clicáveis para Miniaturas Similares */}
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

      {/* MODAL DA IA (SEM INPUT DE CHAVE DIRETO - USA CONFIGURAÇÕES) */}
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
              <div className="ai-result">{renderFormattedWithCarLinks(aiResult)}</div>
            )}
          </div>
        </div>
      )}

      {/* 2. MODAL DE CONFIGURAÇÕES (CHAVE DE API INTELIGENTE + EXPORTAÇÃO) */}
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
                <button type="button" className="btn-primary" onClick={handleSaveKey}>
                  Salvar Chave
                </button>
              </div>

              <div className="story-section">
                <h3>📤 Exportação e Envio para o Desenvolvedor</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  Gere um arquivo estruturado com todas as histórias editadas (
                  {Object.keys(stories).length}) e pesquisas realizadas ({searchLogs.length})
                  ou envie por e-mail para análise.
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SOBRE */}
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
