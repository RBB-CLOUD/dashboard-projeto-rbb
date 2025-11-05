// GET /api/google/status - Verificar status de todas as integrações
module.exports = async function(req, res) {
  try {
    const status = {};
    
    // Lista de serviços Google Workspace
    const services = ['gmail', 'calendar', 'sheets', 'drive', 'docs', 'people'];
    
    for (const service of services) {
      // Verificar se existe token/credencial no ambiente
      const envVarName = `GOOGLE_${service.toUpperCase()}_TOKEN`;
      const hasCredential = !!process.env[envVarName];
      
      status[service] = {
        connected: hasCredential,
        lastChecked: new Date().toISOString(),
        integrationId: getIntegrationId(service)
      };
    }
    
    res.status(200).json({ success: true, status });
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

function getIntegrationId(service) {
  const ids = {
    gmail: 'connector:ccfg_google-mail_B959E7249792448ABBA58D46AF',
    calendar: 'connector:ccfg_google-calendar_DDDBAC03DE404369B74F32E78D',
    sheets: 'connector:ccfg_google-sheet_E42A9F6CA62546F68A1FECA0E8',
    drive: 'connector:ccfg_google-drive_0F6D7EF5E22543468DB221F94F',
    docs: 'connector:ccfg_google-docs_587BECDAEBD441138D618E3ABD'
  };
  return ids[service] || null;
}
