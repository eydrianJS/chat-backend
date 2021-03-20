const config = require("config");
const express = require("express");
const app = express();

const PORT = process.env.PORT || config.get("port");

app.get("/", (req, res) => {
  res.status(200).send("hello world!");
});

app.listen(PORT, () => console.log(`server is running ${PORT}`));
