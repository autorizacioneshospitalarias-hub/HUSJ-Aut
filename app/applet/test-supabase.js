const SUPABASE_URL = 'https://qdzblswougtmsgtozire.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkemJsc3dvdWd0bXNndG96aXJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NzQyMzYsImV4cCI6MjA4MTM1MDIzNn0.a4eVZfrX7QKyUQtRjI1cSCLJBaie4Vzj6cV4CNfS2Yg';

fetch(`${SUPABASE_URL}/rest/v1/base_hoy?select=id,historial_tramites&limit=1`, {
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`
  }
})
.then(r => r.json())
.then(d => console.log(d))
.catch(e => console.error(e));
