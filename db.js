const config = require('config');
const { MongoClient, ObjectID } = require('mongodb');
const connectionString = process.env.DB_CONNECTION_STRING || config.get('connection_string');

const dbName = 'Chat';
const collectionName = 'Products';

exports.connect = async () =>
  new Promise((resolve, reject) => {
    MongoClient.connect(connectionString, (error, client) => {
      if (error != null) {
        return reject(error);
      }
      resolve(client);
    });
  });

exports.findAll = async (client, collectionName) =>
  new Promise((resolve, reject) => {
    client
      .db(dbName)
      .collection(collectionName)
      .find({})
      .toArray((err, res) => {
        if (err != null) {
          return reject(err);
        }
        resolve(res);
      });
  });

exports.findOne = async (client, collectionName, id) =>
  new Promise((resolve, reject) => {
    client
      .db(dbName)
      .collection(collectionName)
      .find({ _id: ObjectID(id) })
      .toArray((err, res) => {
        if (err != null) {
          return reject(err);
        }
        resolve(res[0]);
      });
  });

exports.pushMessage = async (client, collectionName, id, msg) =>
  new Promise((resolve, reject) => {
    const query = { _id: ObjectID(id) };
    const updateDocument = {
      $push: { messages: msg },
    };
    client
      .db(dbName)
      .collection(collectionName)
      .updateOne(query, updateDocument, (err, res) => {
        if (err != null) {
          return reject(err);
        }
        resolve(res);
      });
  });

exports.insertOne = async (client, collectionName, data) =>
  new Promise((resolve, reject) => {
    client
      .db(dbName)
      .collection(collectionName)
      .insertOne(data, (error, response) => {
        if (error != null) {
          return reject(error);
        }
        resolve(response.insertedId);
      });
  });

exports.deleteOne = async (client, productId) =>
  new Promise((resolve, reject) => {
    client
      .db(dbName)
      .collection(collectionName)
      .deleteOne({ _id: productId }, (err, res) => {
        if (err != null) {
          return reject(err);
        }
        resolve(productId);
      });
  });
