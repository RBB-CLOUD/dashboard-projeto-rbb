import { RBB_APIs } from '../../integrations/RBB_APIs.js';

export default async function handler(req, res) {
  try {
    const spotify = await RBB_APIs.spotify();
    
    const profile = await spotify.currentUser.profile();
    
    res.json({
      success: true,
      spotify: {
        nome: profile.display_name,
        email: profile.email,
        id: profile.id,
        tipo_conta: profile.product,
        pais: profile.country,
        seguidores: profile.followers.total,
        imagem: profile.images?.[0]?.url || null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
