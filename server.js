const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT;
const currentAPP = process.env.APP_NAME;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html as the entry point
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
  console.log(`The request was served by the instance${currentAPP}`)
});

app.listen(PORT, () => {
  console.log(`${currentAPP} is listening at http://localhost:${PORT}`);
});
