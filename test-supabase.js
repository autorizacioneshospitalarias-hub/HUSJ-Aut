const SUPABASE_URL = 'https://qdzblswougtmsgtozire.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkemJsc3dvdWd0bXNndG96aXJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NzQyMzYsImV4cCI6MjA4MTM1MDIzNn0.a4eVZfrX7QKyUQtRjI1cSCLJBaie4Vzj6cV4CNfS2Yg';

fetch(`${SUPABASE_URL}/rest/v1/base_hoy?limit=1`, {
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`
  }
})
.then(r => r.json())
.then(d => {
  if (d.length > 0) {
    console.log('Keys:', Object.keys(d[0]));
    console.log('Data:', d[0]);
  } else {
    console.log('No records found');
  }
})
.catch(e => console.error(e));
