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

afterAll(async () => {
  await db.end();
});

describe('GET /invoices', function () {
  test('Gets list of invoices', async () => {
    const response = await request(app).get('/invoices');
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      companies: [
        {
          comp_code: 'apple',
          id: 1,
        },
        {
          comp_code: 'apple',
          id: 2,
        },
        {
          comp_code: 'ibm',
          id: 3,
        },
      ],
    });
  });
});

describe('GET /1', function () {
  test('Return invoice info', async () => {
    const response = await request(app).get('/invoices/1');
    expect(response.body).toEqual({
      invoice: {
        id: 1,
        amt: 100,
        add_date: '2018-01-01T08:00:00.000Z',
        paid: false,
        paid_date: null,
        company: {
          code: 'apple',
          name: 'Apple',
          description: 'Maker of OSX.',
        },
      },
    });
  });

  test('Invalid request returns 404', async () => {
    const response = await request(app).get('/invoices/999');
    expect(response.status).toEqual(404);
  });
});

describe('POST /', function () {
  test('It should add invoice', async () => {
    const response = await request(app)
      .post('/invoices')
      .send({ amt: 400, comp_code: 'ibm' });

    expect(response.body).toEqual({
      invoice: {
        id: 4,
        comp_code: 'ibm',
        amt: 400,
        add_date: expect.any(String),
        paid: false,
        paid_date: null,
      },
    });
  });
});

describe('PUT /', function () {
  test('Update invoice', async () => {
    const response = await request(app)
      .put('/invoices/1')
      .send({ amt: 1000, paid: false });

    expect(response.body).toEqual({
      invoice: {
        id: 1,
        comp_code: 'apple',
        paid: false,
        amt: 1000,
        add_date: expect.any(String),
        paid_date: null,
      },
    });
  });

  test('Invalid request returns 404', async () => {
    const response = await request(app)
      .put('/invoices/999')
      .send({ amt: 1000 });

    expect(response.status).toEqual(404);
  });

  test('Return 500 for missing data', async () => {
    const response = await request(app).put('/invoices/1').send({});

    expect(response.status).toEqual(500);
  });
});

describe('DELETE /', function () {
  test('Delete invoice', async function () {
    const response = await request(app).delete('/invoices/1');

    expect(response.body).toEqual({ status: 'deleted' });
  });

  test('Invalid request returns 404', async function () {
    const response = await request(app).delete('/invoices/999');

    expect(response.status).toEqual(404);
  });
});
