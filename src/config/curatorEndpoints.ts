/**
 * CONFIGURAÇÃO INTERNA DE INTERCEPTAÇÃO E CURADORIA — PEREIRALABS
 * ---------------------------------------------------------------------------
 * Estes endpoints ficam embutidos diretamente no código da aplicação (invisíveis
 * no menu de configurações do usuário final).
 *
 * Sempre que qualquer usuário analisar uma miniatura no celular ou salvar uma
 * história, o interceptador envia automaticamente em segundo plano:
 * - Foto da miniatura em Base64 (800px JPEG, 100% sem metadados EXIF/GPS)
 * - Relatório técnico formatado pela IA (.json e .txt)
 * - Vínculo com o catálogo (#ID ou Sugestão de Próxima Compra)
 */

export const CURATOR_ENDPOINTS = {
  /**
   * 1. GOOGLE WORKSPACE / GOOGLE DRIVE (Google Apps Script Web App URL)
   * Basta implantar o script abaixo em https://script.google.com como "App da Web"
   * (Executar como: "Eu" | Acesso: "Qualquer pessoa") e colar a URL fixa aqui:
   */
  WORKSPACE_APPS_SCRIPT_URL:
    (import.meta.env.VITE_WORKSPACE_WEBHOOK_URL as string | undefined) ||
    'https://script.google.com/macros/s/AKfycbyjOxCwldjlakUXFuL6bLGQDwtelLfyaEZoS4Hko4sQCdi4oAKJYg3Aoqpgl0R7ouf7ZA/exec',

  /**
   * 2. N8N WEBHOOK URL (Automação direta via n8n)
   * Cole aqui a URL de produção do nó Webhook do seu n8n:
   */
  N8N_WEBHOOK_URL:
    (import.meta.env.VITE_N8N_WEBHOOK_URL as string | undefined) || '',

  /**
   * 3. REPOSITÓRIO GITHUB VIA PROXY / WORKER OU VARIÁVEL DE BUILD
   * Nota: Nunca coloque "ghp_..." em texto puro no repositório público para evitar
   * revogação automática do GitHub Secret Scanning. Use VITE_GITHUB_SYNC_TOKEN
   * nas Secrets do GitHub Actions ou passe pelo Google Apps Script / n8n acima.
   */
  GITHUB_REPO_OWNER: 'andreweua',
  GITHUB_REPO_NAME: 'garagem-miniatura',
  GITHUB_SYNC_TOKEN:
    (import.meta.env.VITE_GITHUB_SYNC_TOKEN as string | undefined) || ''
};

/**
 * Script pronto para colar em https://script.google.com (Google Workspace / Drive da PereiraLabs).
 * Cria automaticamente a pasta "Garagem_Miniatura_IA_Reports" no seu Google Drive, salva os arquivos
 * e envia um e-mail com anexo da foto sempre que uma nova análise for recebida:
 */
export const GOOGLE_WORKSPACE_APPS_SCRIPT = `function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var folderName = "Garagem_Miniatura_IA_Reports";
    var folders = DriveApp.getFoldersByName(folderName);
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

    var baseName = payload.filename || ("report-" + new Date().getTime());
    var carName = (payload.content && (payload.content.detectedVehicleName || payload.content.veiculo)) || baseName;

    // 1. Salva arquivo .json com os dados estruturados
    folder.createFile(baseName + ".json", JSON.stringify(payload.content, null, 2), MimeType.PLAIN_TEXT);

    // 2. Salva arquivo .txt formatado
    if (payload.txtContent) {
      folder.createFile(baseName + ".txt", payload.txtContent, MimeType.PLAIN_TEXT);
    }

    // 3. Salva foto .jpg e prepara anexo
    var attachments = [];
    if (payload.imageBase64) {
      var bytes = Utilities.base64Decode(payload.imageBase64);
      var blob = Utilities.newBlob(bytes, "image/jpeg", baseName + ".jpg");
      folder.createFile(blob);
      attachments.push(blob);
    }

    // 4. Envia notificação por e-mail com a foto anexada
    try {
      var userEmail = Session.getEffectiveUser().getEmail();
      var emailSubject = "🏎️ Garagem Miniatura: Nova Análise (" + carName + ")";
      var emailBody = "Olá Andrew!\n\nUma nova miniatura acabou de ser escaneada/sincronizada em segundo plano!\n\n"
        + "📌 Veículo: " + carName + "\n"
        + "🕒 Horário: " + new Date().toLocaleString("pt-BR") + "\n"
        + "📁 Salvo no Google Drive: pasta '" + folderName + "'\n\n"
        + "--- DETALHES TÉCNICOS DA IA ---\n\n"
        + (payload.txtContent || JSON.stringify(payload.content, null, 2)) + "\n\n"
        + "A foto da miniatura está em anexo neste e-mail e salva no seu Google Drive.";

      MailApp.sendEmail({
        to: userEmail,
        subject: emailSubject,
        body: emailBody,
        attachments: attachments
      });
    } catch (mailErr) {
      // Falha silenciosa de e-mail para não impedir gravação no Drive
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  }
}`;
