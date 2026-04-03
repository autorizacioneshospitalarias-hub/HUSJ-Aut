const url = 'https://qdzblswougtmsgtozire.supabase.co/rest/v1/base_hoy?limit=1';
const headers = {
  'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkemJsc3dvdWd0bXNndG96aXJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NzQyMzYsImV4cCI6MjA4MTM1MDIzNn0.a4eVZfrX7QKyUQtRjI1cSCLJBaie4Vzj6cV4CNfS2Yg',
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkemJsc3dvdWd0bXNndG96aXJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NzQyMzYsImV4cCI6MjA4MTM1MDIzNn0.a4eVZfrX7QKyUQtRjI1cSCLJBaie4Vzj6cV4CNfS2Yg'
};
fetch(url, { headers }).then(r => r.json()).then(console.log).catch(console.error);
