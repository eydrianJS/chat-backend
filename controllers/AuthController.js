const User = require('../models/User');
const bcryptjs = require('bcryptjs');
const { connect, insertOne, findByQuery } = require('../db');
const jwt = require('jsonwebtoken');

function validateEmail(email) {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

const register = async (req, res, next) => {
  if (!req.body) {
    return res.status(400).json({
      message: `Fields password, email, name are required`,
    });
  }
  const { password, email, name } = req.body;
  bcryptjs.hash(req.body.password, 10, async (err, hashedPass) => {
    if (err) {
      return res.json({
        error: err,
      });
    }

    if (!password || !email || !name) {
      return res.status(400).json({
        message: `Fields password, email, name are required`,
      });
    }

    if (!validateEmail(email)) {
      return res.status(422).json({
        field: 'email',
        message: `Email format is incorrect`,
      });
    }

    try {
      const client = await connect();
      let userDb = await findByQuery(client, 'Users', {
        $or: [{ email: email }, { userName: name }],
      });

      if (!!userDb.length) {
        if (userDb[0].userName == name) {
          return res.status(422).json({
            field: 'name',
            message: `User with the name ${name} already exists`,
          });
        }
        if (userDb[0].email == email) {
          return res.status(422).json({
            field: 'email',
            message: `Account assignt to ${email} already exists`,
          });
        }
      }
      const user = await insertOne(
        client,
        'Users',
        new User({
          userName: req.body.name,
          email: req.body.email,
          password: hashedPass,
          receivedInvite: [],
        })
      );

      console.log('🚀 ~ file: AuthController.js ~ line 68 ~ bcryptjs.hash ~ user', user);
      let token = jwt.sign({ uid: user }, 'verySecretValue', { expiresIn: '12h' });
      res.status(200).json({
        token,
        user,
      });
    } catch (e) {
      return res.json(e);
    }
  });
};

const login = async (req, res, next) => {
  let userName = req.body.name;
  let password = req.body.password;
  try {
    const client = await connect();
    let user = await findByQuery(client, 'Users', {
      $or: [{ email: userName }, { userName: userName }],
    });
    if (!!user.length) {
      const response = await bcryptjs.compare(password, user[0].password);
      if (!response) {
        return res.status(401).json('Unauthorize');
      } else {
        let token = jwt.sign({ uid: user[0]._id }, 'verySecretValue', { expiresIn: '12h' });
        res.status(200).json({
          token,
        });
      }
    }
  } catch (e) {
    return res.status(500).json(e);
  }
};

module.exports = {
  register,
  login,
};
