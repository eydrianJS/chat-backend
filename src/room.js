const express = require('express');
const router = express.Router();
const { connect, findAll, findOne, pushMessage, insertOne } = require('../db');
const jwtDecode = require('jwt-decode');

router.get('/room', async (req, res) => {
  try {
    const client = await connect();
    let total = await findAll(client, 'Rooms');
    return res.json(total);
  } catch (e) {
    res.json(e);
  }
});

router.post('/room', async (req, res) => {
  const client = await connect();

  if (!req?.body?.name || req?.body?.isPrivate == undefined) {
    return res.status(400).json('Bad validation');
  }
  const token = jwtDecode(req.headers.authorization.replace('Bearer ', ''));
  const user = await findOne(client, 'Users', token.uid);
  if (!user) {
    return res.status(401).json();
  }
  const json = {
    name: req.body.name,
    isPrivate: req.body.isPrivate,
    messages: [],
    owner: user,
    usersWithCredentials: [user],
  };

  try {
    const client = await connect();
    let roomId = await insertOne(client, 'Rooms', json);
    return res.json({ roomId: roomId });
  } catch (e) {
    res.json(e);
  }
});

router.get('/room/:id', async (req, res) => {
  try {
    const client = await connect();
    let total = await findOne(client, 'Rooms', req.params.id);
    return res.json(total);
  } catch (e) {
    res.json(e);
  }
});

module.exports = router;
