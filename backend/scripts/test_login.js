fetch('http://localhost:5000/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ identifier: 'admin', password: 'admin', role: 'admin' })
})
.then(res => res.json().then(data => ({status: res.status, body: data})))
.then(console.log)
.catch(console.error);
