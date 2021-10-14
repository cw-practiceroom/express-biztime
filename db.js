const { Client } = require('pg');

const DB_URI =
  process.env.NODE_ENV === 'test'
    ? 'postgresql:///biztime_test'
    : 'postgresql:///biztime';

const client = new Client({
  connectionString: 'postgresql:///biztime',
});

client.connect();

module.exports = client;
