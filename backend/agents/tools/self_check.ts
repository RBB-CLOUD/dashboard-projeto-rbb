// backend/agents/tools/self_check.ts
export async function selfCheck() {
  const requiredEnvs = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY'
  ];
  
  const missing = requiredEnvs.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    console.warn(`⚠️ Missing environment variables: ${missing.join(', ')}`);
  } else {
    console.log('✅ All required environment variables are set');
  }
  
  return true;
}
