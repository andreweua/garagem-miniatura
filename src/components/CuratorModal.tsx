import React, { useState } from 'react';
import { CarItem, IaReportEntry, StoriesMap } from '../types/car';
import { CameraStudioModal } from './CameraStudioModal';
import { GoogleGenAI } from '@google/genai';

interface CuratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  isUnlocked: boolean;
  setIsUnlocked: (unlocked: boolean) => void;
  allCars: CarItem[];
  onAddNewCar: (newCar: CarItem) => void;
  iaReports: IaReportEntry[];
  onApproveReport: (report: IaReportEntry, updatedStoryText?: string) => void;
  onDiscardReport: (reportId: string) => void;
  stories: StoriesMap;
  apiKey: string;
  setApiKey: (key: string) => void;
  onOpenStudioCameraForNewCar?: () => void;
  onSyncCloudReports?: () => Promise<number>;
  onImportJsonReports?: (importedReports: IaReportEntry[]) => void;
}

const DEFAULT_PIN = '2026';
const GOOGLE_DRIVE_FOLDER_URL =
  'https://drive.google.com/drive/folders/17WD1UUtoSJFzGqfTWDnZVzCOajzZYfUk?usp=sharing';

export function CuratorModal({
  isOpen,
  onClose,
  isUnlocked,
  setIsUnlocked,
  allCars,
  onAddNewCar,
  iaReports,
  onApproveReport,
  onDiscardReport,
  stories,
  apiKey,
  setApiKey,
  onSyncCloudReports,
  onImportJsonReports
}: CuratorModalProps) {
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [activeTab, setActiveTab] = useState<'moderation' | 'add_car' | 'studio' | 'audit'>('moderation');

  // Sincronização com o Google Drive
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [syncCloudMsg, setSyncCloudMsg] = useState<string | null>(null);

  // Estado para cadastro de novo veículo
  const nextCarId = Math.max(0, ...allCars.map((c) => c.id)) + 1;
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState('');
  const [fabricante, setFabricante] = useState('Hot Wheels');
  const [categoria, setCategoria] = useState('Esportivo');
  const [escala, setEscala] = useState('1:64');
  const [precoCompra, setPrecoCompra] = useState('');
  const [historia, setHistoria] = useState('');
  const [newCarPhoto, setNewCarPhoto] = useState<string | null>(null);

  // Estados de IA para o formulário de cadastro
  const [isAiFilling, setIsAiFilling] = useState(false);
  const [aiFillMsg, setAiFillMsg] = useState<string | null>(null);

  // Estado de edição de item na fila de moderação
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [editingReportText, setEditingReportText] = useState('');

  // Câmera de estúdio interna do curador
  const [isStudioCamOpen, setIsStudioCamOpen] = useState(false);

  // Filtro na fila de moderação
  const [queueFilter, setQueueFilter] = useState<'todos' | 'novos' | 'existentes'>('todos');

  const handleSyncCloud = async () => {
    if (!onSyncCloudReports) return;
    setIsSyncingCloud(true);
    setSyncCloudMsg('Consultando pasta do Google Drive...');
    try {
      const count = await onSyncCloudReports();
      if (count > 0) {
        setSyncCloudMsg(`✅ ${count} novo(s) relatório(s) sincronizado(s) do Google Drive com sucesso!`);
      } else {
        setSyncCloudMsg('ℹ️ A fila de moderação já contém todos os relatórios do Google Drive.');
      }
    } catch {
      setSyncCloudMsg('⚠️ Dica: Você também pode importar direto os arquivos .json baixados do Drive pelo botão "Importar JSON".');
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handleJsonFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = String(ev.target?.result || '');
        const parsed = JSON.parse(text);
        const list = Array.isArray(parsed)
          ? parsed
          : (parsed.reports || [parsed.content || parsed]);
        if (onImportJsonReports) {
          onImportJsonReports(list);
          setSyncCloudMsg(`✅ Relatório importado de ${file.name}!`);
        }
      } catch {
        alert('Erro ao ler arquivo JSON. Verifique se é um arquivo de relatório válido.');
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === DEFAULT_PIN) {
      setIsUnlocked(true);
      setPinError(false);
      setPinInput('');
      try {
        localStorage.setItem('garagem_curator_session', 'true');
      } catch {}
    } else {
      setPinError(true);
    }
  };

  const handleLock = () => {
    setIsUnlocked(false);
    try {
      localStorage.removeItem('garagem_curator_session');
    } catch {}
  };

  // Preenchimento automático com Gemini no cadastro de novo carrinho
  const handleAiAutoFill = async () => {
    if (!newCarPhoto) {
      alert('Tire uma foto ou carregue uma imagem da miniatura primeiro!');
      return;
    }
    const currentKey = apiKey.trim() || localStorage.getItem('gemini_api_key') || '';
    if (!currentKey) {
      alert('Configure sua chave do Google Gemini na aba "Auditoria & Chave" ou nas Configurações!');
      return;
    }

    setIsAiFilling(true);
    setAiFillMsg('Analisando miniatura com Google Gemini...');

    try {
      const base64Data = newCarPhoto.includes(',')
        ? newCarPhoto.split(',')[1]
        : newCarPhoto;

      const ai = new GoogleGenAI({ apiKey: currentKey });
      const prompt = `Analise detalhadamente a foto desta réplica/miniatura die-cast.
Identifique o veículo e responda ESTRITAMENTE em formato JSON (sem blocos markdown):
{
  "marca": "Marca do carro (ex: Ferrari, Chevrolet, Porsche)",
  "modelo": "Modelo específico do carro (ex: F40, Opala SS, 911 GT3)",
  "ano": "Ano aproximado de fabricação do carro real",
  "categoria": "Uma das seguintes: Clássico, Nacional, Esportivo, Muscle Car, Utilitário ou Viatura / Serviço",
  "fabricante": "Fabricante da miniatura se visível (ex: Hot Wheels, Matchbox, Maisto, Bburago, etc.) ou vazio",
  "escala": "Escala provável (ex: 1:64)",
  "historia": "História resumida e curiosidades do modelo automotivo real e detalhes da miniatura para o catálogo."
}`;

      const interaction = await ai.interactions.create({
        model: 'gemini-3.8-flash',
        input: [
          { type: 'text', text: prompt },
          {
            type: 'image',
            data: base64Data,
            mime_type: 'image/jpeg'
          }
        ]
      });

      const interactionRecord = interaction as unknown as {
        output_text?: string;
        outputs?: Array<{ type?: string; text?: string }>;
      };
      const rawText =
        interactionRecord.output_text ||
        interactionRecord.outputs?.find((o) => o.type === 'text')?.text ||
        '{}';
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      if (parsed.marca) setMarca(parsed.marca);
      if (parsed.modelo) setModelo(parsed.modelo);
      if (parsed.ano) setAno(parsed.ano);
      if (parsed.fabricante) setFabricante(parsed.fabricante);
      if (parsed.categoria) setCategoria(parsed.categoria);
      if (parsed.escala) setEscala(parsed.escala);
      if (parsed.historia) setHistoria(parsed.historia);

      setAiFillMsg('✅ Dados preenchidos pela IA! Você pode ajustá-los antes de salvar.');
    } catch (err: any) {
      console.error('Erro no auto-fill:', err);
      setAiFillMsg(`❌ Erro na análise: ${err.message || String(err)}`);
    } finally {
      setIsAiFilling(false);
    }
  };

  const handleSaveNewCar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!marca.trim() || !modelo.trim()) {
      alert('Preencha pelo menos a Marca e o Modelo do veículo!');
      return;
    }

    const newCar: CarItem = {
      id: nextCarId,
      marca: marca.trim(),
      modelo: modelo.trim(),
      ano: ano.trim() || '—',
      fabricante: fabricante.trim() || 'Hot Wheels',
      categoria: categoria || 'Esportivo',
      icon: '🏎️',
      foto: newCarPhoto || '',
      escala: escala.trim() || '1:64',
      precoCompra: precoCompra.trim() || undefined,
      historia: historia.trim() || undefined
    };

    onAddNewCar(newCar);

    // Limpa o formulário
    setMarca('');
    setModelo('');
    setAno('');
    setFabricante('Hot Wheels');
    setCategoria('Esportivo');
    setEscala('1:64');
    setPrecoCompra('');
    setHistoria('');
    setNewCarPhoto(null);
    setAiFillMsg(null);

    alert(`🎉 Veículo #${newCar.id} (${newCar.marca} ${newCar.modelo}) cadastrado com sucesso no acervo!`);
  };

  const filteredReports = iaReports.filter((r) => {
    if (queueFilter === 'novos') return r.isNewAcquisition;
    if (queueFilter === 'existentes') return !r.isNewAcquisition;
    return true;
  });

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content modal-curator-content" onClick={(e) => e.stopPropagation()}>
          <button className="close-btn" aria-label="Fechar" onClick={onClose}>
            &times;
          </button>

          {!isUnlocked ? (
            /* TELA DE AUTENTICAÇÃO DO CURADOR */
            <div className="curator-pin-screen">
              <div className="curator-pin-icon">🛡️</div>
              <h2>Acesso Restrito — Modo Curador</h2>
              <p>
                Área reservada para curadoria do acervo, moderação de sugestões e cadastro de novos
                veículos (PereiraLabs).
              </p>
              <form onSubmit={handlePinSubmit} className="curator-pin-form">
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="Digite o PIN do Curador (Padrão: 2026)"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError(false);
                  }}
                  autoFocus
                />
                <button type="submit" className="btn-primary">
                  🔓 Desbloquear Curadoria
                </button>
              </form>
              {pinError && <div className="curator-pin-error">❌ PIN incorreto. Tente novamente.</div>}
            </div>
          ) : (
            /* PAINEL DO CURADOR DESBLOQUEADO */
            <div className="curator-dashboard">
              <div className="curator-header">
                <div className="curator-title-area">
                  <span className="badge">PereiraLabs • Curadoria Ativa</span>
                  <h2>🛡️ Painel do Curador</h2>
                </div>
                <button type="button" className="btn-mini btn-mini-cancel" onClick={handleLock}>
                  🔒 Encerrar Sessão
                </button>
              </div>

              {/* ABAS DO PAINEL */}
              <div className="curator-tabs">
                <button
                  type="button"
                  className={`curator-tab-btn ${activeTab === 'moderation' ? 'active' : ''}`}
                  onClick={() => setActiveTab('moderation')}
                >
                  📋 Fila de Moderação ({iaReports.length})
                </button>
                <button
                  type="button"
                  className={`curator-tab-btn ${activeTab === 'add_car' ? 'active' : ''}`}
                  onClick={() => setActiveTab('add_car')}
                >
                  ➕ Cadastrar Novo Veículo
                </button>
                <button
                  type="button"
                  className={`curator-tab-btn ${activeTab === 'studio' ? 'active' : ''}`}
                  onClick={() => setActiveTab('studio')}
                >
                  📐 Gabarito de Estúdio
                </button>
                <button
                  type="button"
                  className={`curator-tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
                  onClick={() => setActiveTab('audit')}
                >
                  📊 Auditoria &amp; IA
                </button>
              </div>

              {/* CONTEÚDO DAS ABAS */}
              <div className="curator-body">
                {/* ABA 1: FILA DE MODERAÇÃO */}
                {activeTab === 'moderation' && (
                  <div className="curator-section">
                    {/* BARRA DE FERRAMENTAS DA NUVEM (GOOGLE DRIVE / APPS SCRIPT) */}
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '14px',
                        padding: '10px 12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ padding: '6px 12px', fontSize: '13px' }}
                        onClick={handleSyncCloud}
                        disabled={isSyncingCloud}
                      >
                        {isSyncingCloud ? '⏳ Sincronizando...' : '🔄 Solicitar Atualização da Nuvem'}
                      </button>

                      <label
                        className="btn-mini"
                        style={{
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '6px 10px',
                          margin: 0,
                          fontSize: '13px'
                        }}
                        title="Importar relatórios (.json) gerados em outro celular ou salvos no Drive"
                      >
                        📁 Importar JSON
                        <input
                          type="file"
                          accept=".json,application/json"
                          onChange={handleJsonFileInput}
                          style={{ display: 'none' }}
                        />
                      </label>

                      <a
                        href={GOOGLE_DRIVE_FOLDER_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-mini"
                        style={{
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '6px 10px',
                          fontSize: '13px'
                        }}
                      >
                        📂 Abrir Pasta Drive ↗
                      </a>
                    </div>

                    {syncCloudMsg && (
                      <div
                        style={{
                          padding: '8px 12px',
                          marginBottom: '12px',
                          borderRadius: '6px',
                          background: 'rgba(59, 130, 246, 0.15)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          fontSize: '13px',
                          color: '#93c5fd'
                        }}
                      >
                        {syncCloudMsg}
                      </div>
                    )}

                    <div className="curator-filter-row">
                      <div className="queue-pills">
                        <button
                          type="button"
                          className={`pill ${queueFilter === 'todos' ? 'active' : ''}`}
                          onClick={() => setQueueFilter('todos')}
                        >
                          Todos ({iaReports.length})
                        </button>
                        <button
                          type="button"
                          className={`pill ${queueFilter === 'existentes' ? 'active' : ''}`}
                          onClick={() => setQueueFilter('existentes')}
                        >
                          Catálogo Existente ({iaReports.filter((r) => !r.isNewAcquisition).length})
                        </button>
                        <button
                          type="button"
                          className={`pill ${queueFilter === 'novos' ? 'active' : ''}`}
                          onClick={() => setQueueFilter('novos')}
                        >
                          Novas Aquisições ({iaReports.filter((r) => r.isNewAcquisition).length})
                        </button>
                      </div>
                    </div>

                    {filteredReports.length === 0 ? (
                      <div className="curator-empty">
                        <span>✨</span>
                        <p>A fila de moderação local está vazia!</p>
                        <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
                          Se as pesquisas foram feitas em outro celular (como no do seu pai),
                          clique em <strong>"🔄 Solicitar Atualização da Nuvem"</strong> acima ou use <strong>"📁 Importar JSON"</strong>.
                        </p>
                        <div style={{ marginTop: '12px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="btn-primary"
                            onClick={handleSyncCloud}
                            disabled={isSyncingCloud}
                          >
                            {isSyncingCloud ? '⏳ Buscando no Drive...' : '🔄 Sincronizar Agora'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="moderation-list">
                        {filteredReports.map((report) => (
                          <div key={report.id} className="moderation-card">
                            <div className="moderation-header">
                              <div>
                                <span className={`status-pill ${report.isNewAcquisition ? 'new' : 'match'}`}>
                                  {report.isNewAcquisition ? '🌟 Nova Aquisição' : `🚗 Item do Acervo (#${report.matchedCarId})`}
                                </span>
                                <h4>{report.detectedVehicleName}</h4>
                                <small>{new Date(report.createdAt).toLocaleString('pt-BR')}</small>
                              </div>
                            </div>

                            <div className="moderation-content">
                              {editingReportId === report.id ? (
                                <textarea
                                  className="story-textarea"
                                  value={editingReportText}
                                  onChange={(e) => setEditingReportText(e.target.value)}
                                  rows={5}
                                />
                              ) : (
                                <pre className="moderation-text">{report.cleanMarkdown}</pre>
                              )}
                            </div>

                            <div className="moderation-actions">
                              {editingReportId === report.id ? (
                                <>
                                  <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={() => {
                                      onApproveReport(report, editingReportText);
                                      setEditingReportId(null);
                                    }}
                                  >
                                    💾 Salvar e Aprovar
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-mini btn-mini-cancel"
                                    onClick={() => setEditingReportId(null)}
                                  >
                                    Cancelar Edição
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={() => onApproveReport(report)}
                                  >
                                    ✅ Aprovar para o Catálogo
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-mini btn-mini-cancel"
                                    onClick={() => {
                                      setEditingReportId(report.id);
                                      setEditingReportText(report.cleanMarkdown);
                                    }}
                                  >
                                    ✏️ Ajustar Texto
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-mini btn-mini-cancel"
                                    style={{ color: '#ef4444' }}
                                    onClick={() => onDiscardReport(report.id)}
                                  >
                                    ❌ Descartar
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ABA 2: CADASTRAR NOVO VEÍCULO */}
                {activeTab === 'add_car' && (
                  <form onSubmit={handleSaveNewCar} className="curator-add-form">
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Número do Veículo no Acervo:</label>
                        <input type="text" value={`#${nextCarId}`} disabled style={{ fontWeight: 'bold' }} />
                      </div>

                      <div className="form-group">
                        <label>Marca do Automóvel *:</label>
                        <input
                          type="text"
                          placeholder="Ex: Ferrari, Chevrolet, Porsche"
                          value={marca}
                          onChange={(e) => setMarca(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Modelo do Veículo *:</label>
                        <input
                          type="text"
                          placeholder="Ex: F40, Opala SS, 911 GT3"
                          value={modelo}
                          onChange={(e) => setModelo(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Ano de Fabricação (ou época):</label>
                        <input
                          type="text"
                          placeholder="Ex: 1987 ou 2022"
                          value={ano}
                          onChange={(e) => setAno(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label>Fabricante da Miniatura:</label>
                        <input
                          type="text"
                          placeholder="Ex: Hot Wheels, Matchbox, Maisto, Bburago"
                          value={fabricante}
                          onChange={(e) => setFabricante(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label>Categoria:</label>
                        <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                          <option value="Clássico">Clássico</option>
                          <option value="Nacional">Nacional</option>
                          <option value="Esportivo">Esportivo</option>
                          <option value="Muscle Car">Muscle Car</option>
                          <option value="Utilitário">Utilitário</option>
                          <option value="Viatura / Serviço">Viatura / Serviço</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Escala da Miniatura:</label>
                        <input
                          type="text"
                          placeholder="Ex: 1:64, 1:43, 1:18"
                          value={escala}
                          onChange={(e) => setEscala(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label>Preço de Compra (Opcional):</label>
                        <input
                          type="text"
                          placeholder="Ex: R$ 14,90"
                          value={precoCompra}
                          onChange={(e) => setPrecoCompra(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* FOTO E IA AUTO-FILL */}
                    <div className="form-photo-section">
                      <label><strong>📸 Foto da Miniatura (Padronizada 4:3):</strong></label>
                      <div className="photo-actions-row">
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => setIsStudioCamOpen(true)}
                        >
                          📸 Tirar Foto com Gabarito de Estúdio
                        </button>
                        <label className="btn-secondary" style={{ cursor: 'pointer' }}>
                          📁 Escolher Arquivo
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => setNewCarPhoto(String(ev.target?.result || ''));
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        {newCarPhoto && (
                          <button
                            type="button"
                            className="btn-accent"
                            disabled={isAiFilling}
                            onClick={handleAiAutoFill}
                          >
                            {isAiFilling ? '⏳ Analisando...' : '🤖 Preencher Dados com Gemini Vision'}
                          </button>
                        )}
                      </div>

                      {aiFillMsg && <div className="ai-fill-status">{aiFillMsg}</div>}

                      {newCarPhoto && (
                        <div className="photo-preview-box">
                          <img src={newCarPhoto} alt="Prévia da Miniatura" />
                          <button
                            type="button"
                            className="btn-mini btn-mini-cancel"
                            onClick={() => setNewCarPhoto(null)}
                          >
                            Remover Foto
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="form-group" style={{ marginTop: '16px' }}>
                      <label>História / Ficha Técnica da Miniatura:</label>
                      <textarea
                        className="story-textarea"
                        placeholder="Insira detalhes sobre o carro real, sua importância histórica, conservação e acabamento da miniatura..."
                        value={historia}
                        onChange={(e) => setHistoria(e.target.value)}
                        rows={4}
                      />
                    </div>

                    <div style={{ marginTop: '20px' }}>
                      <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px' }}>
                        💾 Cadastrar Veículo no Acervo (# {nextCarId})
                      </button>
                    </div>
                  </form>
                )}

                {/* ABA 3: GABARITO DE ESTÚDIO */}
                {activeTab === 'studio' && (
                  <div className="curator-section">
                    <h3>📐 Padrão Fotográfico PereiraLabs (Sem Corte e Sem Desfoque)</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                      Para que todas as miniaturas tenham fotos com o mesmo padrão profissional de catálogo,
                      siga as 5 regras de ouro do nosso gabarito:
                    </p>

                    <div className="studio-rules-grid">
                      <div className="studio-rule-card">
                        <span className="rule-icon">🖼️</span>
                        <strong>1. Proporção 4:3</strong>
                        <p>Evite formato retrato ou panorâmico. O padrão 4:3 enquadra o perfil completo do veículo.</p>
                      </div>

                      <div className="studio-rule-card">
                        <span className="rule-icon">📏</span>
                        <strong>2. Linha Guia das Rodas</strong>
                        <p>Alinhe a base das rodas exatamente sobre a linha guia inferior para manter nivelamento constante.</p>
                      </div>

                      <div className="studio-rule-card">
                        <span className="rule-icon">🛡️</span>
                        <strong>3. Área Segura (80%)</strong>
                        <p>Deixe folga de 10% nas bordas para nunca cortar para-choques, aerofólio ou espelhos retrovisores.</p>
                      </div>

                      <div className="studio-rule-card">
                        <span className="rule-icon">💡</span>
                        <strong>4. Luz Branca Rebatida</strong>
                        <p>Nunca use flash direto frontal. Use luz difusa de cima e laterais para evitar pontos cegos e reflexos de tinta.</p>
                      </div>

                      <div className="studio-rule-card">
                        <span className="rule-icon">⬜</span>
                        <strong>5. Fundo Neutro Fosco</strong>
                        <p>Utilize folha de EVA ou papel fosco branco ou cinza claro como fundo infinito (curva suave sem dobra).</p>
                      </div>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '24px' }}>
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ padding: '12px 24px', fontSize: '1rem' }}
                        onClick={() => setIsStudioCamOpen(true)}
                      >
                        📸 Abrir Câmera com Gabarito de Estúdio em Tempo Real
                      </button>
                    </div>
                  </div>
                )}

                {/* ABA 4: AUDITORIA & CHAVE GEMINI */}
                {activeTab === 'audit' && (
                  <div className="curator-section">
                    <h3>📊 Status do Acervo &amp; Identificação por IA</h3>
                    <div className="audit-metrics-row">
                      <div className="audit-box">
                        <span className="num">{allCars.length}</span>
                        <span className="lbl">Modelos no Acervo</span>
                      </div>
                      <div className="audit-box">
                        <span className="num">75</span>
                        <span className="lbl">Fotos Físicas Existentes</span>
                      </div>
                      <div className="audit-box">
                        <span className="num" style={{ color: '#f59e0b' }}>5</span>
                        <span className="lbl">Modelos a Identificar</span>
                      </div>
                      <div className="audit-box">
                        <span className="num" style={{ color: '#38bdf8' }}>{Object.keys(stories).length}</span>
                        <span className="lbl">Histórias Gravadas</span>
                      </div>
                    </div>

                    <h4 style={{ marginTop: '20px' }}>🔍 Miniaturas que aguardam identificação:</h4>
                    <ul className="audit-pending-list">
                      <li>• <strong>#25</strong> — Van Modelo a Identificar (foto: <code>public/img/25.jpg</code>)</li>
                      <li>• <strong>#35</strong> — Calhambeque Modelo a Identificar (foto: <code>public/img/35.jpg</code>)</li>
                      <li>• <strong>#52</strong> — BMW Modelo a Identificar (foto: <code>public/img/52.jpg</code>)</li>
                      <li>• <strong>#56</strong> — Koenigsegg Modelo a Identificar (foto: <code>public/img/56.jpg</code>)</li>
                      <li>• <strong>#84</strong> — Cadillac Modelo a Identificar (foto: <code>public/img/84.jpg</code>)</li>
                    </ul>

                    <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg-card)', borderRadius: '8px' }}>
                      <h4>🔑 Chave da API Google Gemini:</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Utilizada pelo IA Scanner, Auto-Fill de cadastro e pelo script de auditoria em lote.
                      </p>
                      <div className="key-container" style={{ marginTop: '8px' }}>
                        <input
                          type="password"
                          placeholder="Cole sua Chave da API Google AI..."
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => {
                            if (apiKey.trim()) {
                              localStorage.setItem('gemini_api_key', apiKey.trim());
                              alert('✅ Chave Gemini salva com sucesso!');
                            }
                          }}
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DA CÂMERA DE ESTÚDIO */}
      <CameraStudioModal
        isOpen={isStudioCamOpen}
        onClose={() => setIsStudioCamOpen(false)}
        onCapture={(imgDataUrl) => {
          setNewCarPhoto(imgDataUrl);
          setIsStudioCamOpen(false);
          setActiveTab('add_car');
        }}
      />
    </>
  );
}
