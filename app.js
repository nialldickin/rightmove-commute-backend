const serverless = require("serverless-http");
const express = require("express");
const fetch = require("node-fetch");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const API_KEY = process.env.API_KEY;

function queryParamsValid(query) {
  const { latitude, longitude, destination, mode } = query;

  return (
    parseFloat(latitude) &&
    parseFloat(longitude) &&
    destination.length &&
    mode.length
  );
}

app.get("/travelmatrix/", async (req, res) => {
  if (queryParamsValid(req.query)) {
    const { latitude, longitude, destination, mode } = req.query;

    const url = [
      "https://maps.googleapis.com/maps/api/distancematrix/json?",
      `origins=${latitude},${longitude}&`,
      `destinations=${destination}&`,
      `mode=${mode}&`,
      `key=${API_KEY}`,
    ].join("");

    const response = await fetch(encodeURI(url));
    if (response.ok) {
      const json = await response.json();
      const result = json.rows[0].elements[0];

      if (result && result.duration) {
        res.status(200).send({ durationText: result.duration.text });
      } else {
        // Google API didn't produce a valid response, destination probably not reachable from origin
        // User needs to provide a more specific destination
        res.sendStatus(400);
      }
    } else {
      // Google API call didn't respond with a 200 status code
      res.sendStatus(502);
    }
  } else {
    // Badly formed request: query params not valid
    res.sendStatus(400);
  }
});

module.exports.handler = serverless(app);
