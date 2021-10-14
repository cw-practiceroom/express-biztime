process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const { createData } = require('../_test-common');
const db = require('../db');

beforeEach(async () => {
  await db.query('DELETE FROM invoices');
  await db.query('DELETE FROM companies');
  await db.query("SELECT setval('invoices_id_seq', 1, false)");

  await db.query(`INSERT INTO companies (code, name, description)
                    VALUES ('apple', 'Apple', 'Maker of OSX.'),
                           ('ibm', 'IBM', 'Big blue.')`);

  const inv = await db.query(
    `INSERT INTO invoices (comp_code, amt, paid, add_date, paid_date)
           VALUES ('apple', 100, false, '2018-01-01', null),
                  ('apple', 200, true, '2018-02-01', '2018-02-02'), 
                  ('ibm', 300, false, '2018-03-01', null)
           RETURNING id`
  );
});

afterAll(async () => {
  await db.end();
});

describe('GET /companies', function () {
  test('Gets list of companies', async () => {
    const response = await request(app).get('/companies');
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      companies: [
        {
          code: 'apple',
          name: 'Apple',
        },
        {
          code: 'ibm',
          name: 'IBM',
        },
      ],
    });
  });
});

describe('GET /companies/code', function () {
  test('Returns data on single company', async () => {
    const response = await request(app).get('/companies/apple');
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      user: {
        code: 'apple',
        name: 'Apple',
        description: 'Maker of OSX.',
      },
    });
  });

  test('Invalid request returns 404', async () => {
    const response = await request(app).get('/companies/dog');
    expect(response.statusCode).toEqual(404);
  });
});

describe('POST /companies', function () {
  test('Creates company', async () => {
    const response = await request(app).post('/companies').send({
      name: 'Dudes',
      description: 'Just dudes',
    });
    expect(response.body).toEqual({
      company: {
        code: 'dudes',
        name: 'Dudes',
        description: 'Just dudes',
      },
    });
  });
});

describe('PUT /', function () {
  test('Update company', async () => {
    const response = await request(app)
      .put('/companies/apple')
      .send({ name: 'AppleEdit', description: 'NewDescrip' });

    expect(response.body).toEqual({
      company: {
        code: 'apple',
        name: 'AppleEdit',
        description: 'NewDescrip',
      },
    });
  });

  test('Invalid request returns', async () => {
    const response = await request(app)
      .put('/companies/dog')
      .send({ name: 'dog' });

    expect(response.status).toEqual(404);
  });
});

describe('DELETE /', function () {
  test('Delete company', async () => {
    const response = await request(app).delete('/companies/apple');

    expect(response.body).toEqual({ status: 'deleted' });
  });

  test('It should return 404 for no-such-comp', async () => {
    const response = await request(app).delete('/companies/dog');

    expect(response.status).toEqual(404);
  });
});
