// POST /api/google/connect - Iniciar conexão com uma integração
module.exports = async function(req, res) {
  try {
    const { service } = req.body;
    
    if (!service) {
      return res.status(400).json({ 
        success: false, 
        error: 'Serviço não especificado' 
      });
    }

    const integrationIds = {
      gmail: 'connector:ccfg_google-mail_B959E7249792448ABBA58D46AF',
      calendar: 'connector:ccfg_google-calendar_DDDBAC03DE404369B74F32E78D',
      sheets: 'connector:ccfg_google-sheet_E42A9F6CA62546F68A1FECA0E8',
      drive: 'connector:ccfg_google-drive_0F6D7EF5E22543468DB221F94F',
      docs: 'connector:ccfg_google-docs_587BECDAEBD441138D618E3ABD'
    };

    const integrationId = integrationIds[service];
    
    if (!integrationId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Serviço não suportado. Use: gmail, calendar, sheets, drive, docs' 
      });
    }

    // Retornar instruções para usar o Replit Connector
    res.status(200).json({
      success: true,
      message: `Para conectar ${service}, use o Replit Connector`,
      integrationId: integrationId,
      instructions: [
        '1. Clique em "Tools" no menu lateral do Replit',
        '2. Selecione "Secrets" ou "Integrations"',
        `3. Procure por "${service}" e clique em "Connect"`,
        '4. Autorize o acesso à sua conta Google',
        '5. Volte ao painel e teste a integração'
      ]
    });

  } catch (error) {
    console.error('Erro ao conectar:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
