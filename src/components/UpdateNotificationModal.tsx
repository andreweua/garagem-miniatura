import React from 'react';
import type { RemoteVersionInfo } from '../utils/versionChecker';

interface UpdateNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  remoteInfo: RemoteVersionInfo | null;
  currentVersion: string;
  platformLabel: string;
  platformType: 'android' | 'ios' | 'pwa' | 'web';
  onPlaySoundAgain?: () => void;
}

export const UpdateNotificationModal: React.FC<UpdateNotificationModalProps> = ({
  isOpen,
  onClose,
  remoteInfo,
  currentVersion,
  platformLabel,
  platformType,
  onPlaySoundAgain
}) => {
  if (!isOpen || !remoteInfo) return null;

  const isAndroid = platformType === 'android';
  const downloadUrl = remoteInfo.downloadUrl || 'https://github.com/andreweua/garagem-miniatura/releases';

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
          <div className="update-badge-pill">
            <span className="pulse-dot"></span>
            NOVA ATUALIZAÇÃO DISPONÍVEL
          </div>
          <button
            type="button"
            className="update-modal-close"
            onClick={onClose}
            aria-label="Fechar notificação"
          >
            &times;
          </button>
        </div>

        <div className="update-modal-body">
          <div className="update-version-hero">
            <div className="version-box current">
              <span className="box-label">Sua Versão</span>
              <span className="box-val">{currentVersion.startsWith('v') ? currentVersion : `v${currentVersion}`}</span>
              <small className="box-sub">{platformLabel}</small>
            </div>
            <div className="version-arrow">➔</div>
            <div className="version-box target">
              <span className="box-label">Nova Versão</span>
              <span className="box-val">{remoteInfo.version.startsWith('v') ? remoteInfo.version : `v${remoteInfo.version}`}</span>
              <small className="box-sub">Disponível agora</small>
            </div>
          </div>

          <div className="update-notes-card">
            <h4>✨ O que há de novo nesta versão:</h4>
            <p className="update-notes-text">
              {remoteInfo.releaseNotes || 'Melhorias de desempenho, navegação aprimorada e correções de segurança.'}
            </p>
            {remoteInfo.releaseDate && (
              <small className="update-date">Lançado em: {remoteInfo.releaseDate}</small>
            )}
          </div>

          {isAndroid && (
            <div className="update-native-notice">
              ℹ️ <strong>Aplicativo Android Nativo (.APK):</strong><br />
              Para receber as novidades acima, toque no botão abaixo para baixar o arquivo <code>Garagem-Miniatura-{remoteInfo.version}.apk</code> diretamente do GitHub e instale-o no seu aparelho. Seus dados e preferências locais serão preservados.
            </div>
          )}

          {!isAndroid && (
            <div className="update-native-notice">
              ⚡ <strong>PWA / Web:</strong><br />
              Basta tocar no botão abaixo para recarregar a aplicação e ativar a versão mais recente instantaneamente.
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
              🔔 Ouvir Som
            </button>
          )}

          <div className="update-actions-group">
            <button
              type="button"
              className="btn-remind-later"
              onClick={onClose}
            >
              Lembrar Mais Tarde
            </button>

            <button
              type="button"
              className="btn-update-now"
              onClick={handleUpdateAction}
            >
              {isAndroid ? '⬇️ Baixar APK Atualizado' : '🔄 Atualizar Agora'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
