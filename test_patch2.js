const url = 'https://qdzblswougtmsgtozire.supabase.co/rest/v1/base_hoy?id=eq.1901807';
const headers = {
  'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkemJsc3dvdWd0bXNndG96aXJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NzQyMzYsImV4cCI6MjA4MTM1MDIzNn0.a4eVZfrX7QKyUQtRjI1cSCLJBaie4Vzj6cV4CNfS2Yg',
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkemJsc3dvdWd0bXNndG96aXJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NzQyMzYsImV4cCI6MjA4MTM1MDIzNn0.a4eVZfrX7QKyUQtRjI1cSCLJBaie4Vzj6cV4CNfS2Yg',
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};
const data = { tipo_contrato_no_aut: 'TEST' };

fetch(url, { method: 'PATCH', headers, body: JSON.stringify(data) })
  .then(r => {
    if (!r.ok) {
      return r.text().then(text => { throw new Error(text) });
    }
    return r.json();
  })
  .then(console.log)
  .catch(console.error);
