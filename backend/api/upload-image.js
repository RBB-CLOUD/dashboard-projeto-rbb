const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { imageData, fileName } = JSON.parse(body);
        
        if (!imageData || !fileName) {
          return res.status(400).json({ error: 'imageData e fileName são obrigatórios' });
        }

        // Remove prefixo data:image/...;base64,
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Gera nome único
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const ext = path.extname(fileName) || '.jpg';
        const uniqueFileName = `${timestamp}_${randomStr}${ext}`;

        // Salva arquivo
        const uploadsDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const filePath = path.join(uploadsDir, uniqueFileName);
        fs.writeFileSync(filePath, buffer);

        // Retorna URL pública
        const publicUrl = `/uploads/${uniqueFileName}`;
        
        console.log('✅ Imagem salva:', publicUrl);

        res.status(200).json({
          success: true,
          url: publicUrl,
          fileName: uniqueFileName,
          size: buffer.length
        });

      } catch (error) {
        console.error('❌ Erro ao processar upload:', error);
        res.status(500).json({ 
          error: 'Erro ao processar imagem',
          details: error.message 
        });
      }
    });

  } catch (error) {
    console.error('❌ Erro no upload:', error);
    res.status(500).json({ 
      error: 'Erro ao fazer upload',
      details: error.message 
    });
  }
};
