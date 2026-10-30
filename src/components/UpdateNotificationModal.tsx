import React from 'react';
import type { RemoteVersionInfo } from '../utils/versionChecker';

interface UpdateNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  remoteInfo: RemoteVersionInfo | null;
  currentVersion: string;
  platformLabel: string;
  platformType: 'android' | 'ios' | 'pwa' | 'web';
  isUpdateAvailable: boolean;
  onPlaySoundAgain?: () => void;
  onRecheck?: () => void;
}

export const UpdateNotificationModal: React.FC<UpdateNotificationModalProps> = ({
  isOpen,
  onClose,
  remoteInfo,
  currentVersion,
  platformLabel,
  platformType,
  isUpdateAvailable,
  onPlaySoundAgain,
  onRecheck
}) => {
  if (!isOpen) return null;

  const isAndroid = platformType === 'android';
  const downloadUrl = remoteInfo?.downloadUrl || 'https://github.com/andreweua/garagem-miniatura/releases';
  const targetVer = remoteInfo?.version || currentVersion;

  const handleUpdateAction = () => {
    if (isAndroid) {
      window.open(downloadUrl, '_blank');
      onClose();
    } else {
      // PWA ou Web: Forçar reload sem cache para acionar o novo Service Worker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const reg of registrations) {
            reg.update().catch(() => {});
          }
        });
      }
      window.location.reload();
    }
  };

  return (
    <div className="update-modal-backdrop" onClick={onClose}>
      <div
        className="update-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-title"
      >
        <div className="update-modal-header">
          <div className={`update-badge-pill ${isUpdateAvailable ? 'has-update' : 'up-to-date'}`}>
            <span className={`pulse-dot ${isUpdateAvailable ? 'warning' : 'success'}`}></span>
            {isUpdateAvailable ? 'NOVA VERSÃO DISPONÍVEL' : 'STATUS DO APLICATIVO'}
          </div>
          <button
            type="button"
            className="update-modal-close"
            onClick={onClose}
            aria-label="Fechar janela"
          >
            &times;
          </button>
        </div>

        <div className="update-modal-body">
          {isUpdateAvailable ? (
            <>
              <div className="update-version-hero">
                <div className="version-box current">
                  <span className="box-label">Sua Versão</span>
                  <span className="box-val">{currentVersion.startsWith('v') ? currentVersion : `v${currentVersion}`}</span>
                  <small className="box-sub">{platformLabel}</small>
                </div>
                <div className="version-arrow">➔</div>
                <div className="version-box target">
                  <span className="box-label">Nova Versão</span>
                  <span className="box-val">{targetVer.startsWith('v') ? targetVer : `v${targetVer}`}</span>
                  <small className="box-sub">Disponível agora</small>
                </div>
              </div>

              <div className="update-notes-card">
                <h4>✨ O que há de novo:</h4>
                <p className="update-notes-text">
                  {remoteInfo?.releaseNotes || 'Melhorias de desempenho, navegação moderna e correções de segurança.'}
                </p>
                {remoteInfo?.releaseDate && (
                  <small className="update-date">Lançado em: {remoteInfo.releaseDate}</small>
                )}
              </div>

              {isAndroid ? (
                <div className="update-native-notice">
                  🤖 <strong>Aplicativo Android Nativo:</strong><br />
                  Toque no botão abaixo para baixar o arquivo <code>Garagem-Miniatura-{targetVer}.apk</code> no GitHub Releases e instale-o no aparelho. Seus dados locais são preservados.
                </div>
              ) : (
                <div className="update-native-notice">
                  ⚡ <strong>PWA / Web:</strong><br />
                  Toque no botão abaixo para recarregar e ativar a versão mais recente instantaneamente.
                </div>
              )}
            </>
          ) : (
            <div className="uptodate-card-body">
              <div className="uptodate-icon-ring">✅</div>
              <h3>Aplicativo Atualizado</h3>
              <p className="uptodate-version-pill">
                {platformLabel} • {currentVersion.startsWith('v') ? currentVersion : `v${currentVersion}`}
              </p>
              <p className="uptodate-desc">
                Você já está rodando a compilação mais recente do acervo Garagem em Miniatura. Todas as funcionalidades de curadoria, fotos em alta resolução e IA estão operando normalmente.
              </p>
            </div>
          )}
        </div>

        <div className="update-modal-footer">
          {onPlaySoundAgain && (
            <button
              type="button"
              className="btn-sound-preview"
              onClick={onPlaySoundAgain}
              title="Testar som de notificação"
            >
              🔔 Som
            </button>
          )}

          <div className="update-actions-group">
            {isUpdateAvailable ? (
              <>
                <button
                  type="button"
                  className="btn-remind-later"
                  onClick={onClose}
                >
                  Depois
                </button>
                <button
                  type="button"
                  className="btn-update-now"
                  onClick={handleUpdateAction}
                >
                  {isAndroid ? '⬇️ Baixar APK' : '🔄 Atualizar'}
                </button>
              </>
            ) : (
              <>
                {onRecheck && (
                  <button
                    type="button"
                    className="btn-remind-later"
                    onClick={onRecheck}
                  >
                    🔄 Checar
                  </button>
                )}
                <button
                  type="button"
                  className="btn-update-now"
                  onClick={onClose}
                >
                  OK
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
