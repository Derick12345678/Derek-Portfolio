const express = require("express");
const path = require("path");

const app = express();
const PORT = 3001;

// Serve all files in "public"
app.use(express.static(path.join(__dirname, "public")));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
