const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const app = express();  //make an instance of express

//allow us to access to .env
require('dotenv').config();

console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD);
console.log("DB_DATABASE:", process.env.DB_DATABASE);
console.log("DB_PORT:", process.env.DB_PORT);

const port = process.env.PORT;  // default port to listen

const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200
};

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

// Receive requests from a front-end port
app.use(cors(corsOptions));

// Middleware function for database connection
app.use(async function(req, res, next) {
  try {

    //connecting to database
    req.db = await pool.getConnection();
    req.db.connection.config.namedPlaceholders = true;

    await req.db.query(`SET SESSION sql_mode = "TRADITIONAL"`);
    await req.db.query(`SET time_zone = '-8:00'`);

    await next();

      // Release connection to the database when finished
    req.db.release();
  } catch (err) {
    console.log(err);

    if (req.db) req.db.release();
    throw err;
  }
});


app.use(express.json());



// Endpoint to retrieve all cars from the database
app.get('/cars', async function(req, res) {
  try {
    const [cars] = await req.db.query(
      'SELECT * FROM cars;'
      );
    res.json({ success: true, message: 'Car data retrieved successfully', data: cars });
    console.log(`/cars`)
  } catch (err) {
    res.json({ success: false, message: err, data: null });
  }
});

// Middleware function executed after the GET /cars request
app.use(async function(req, res, next) {
  try {
    console.log('Middleware after the get /cars');
  
    await next();

  } catch (err) {
// Handle errors
  }
});

// Endpoint to create a new car entry in the database
app.post('/cars', async function(req, res) {
  try {
    const { make, model, year } = req.body;
  
    const query = await req.db.query(
      `INSERT INTO car (make, model, year) 
       VALUES (:make, :model, :year)`,
      {
        make,
        model,
        year,
      }
    );
  
    res.json({ success: true, message: 'Car successfully created', data: null });
  } catch (err) {
    res.json({ success: false, message: err, data: null })
  }
});

// Endpoint to delete a car entry from the database
app.delete('/cars/:id', async function(req,res) {
  try {
    const {id} = req.params.id;
    const query = await req.db.query(
      `UPDATE cars 
       SET deleted_flag = 1 
       WHERE id = :id`,
      
);

    console.log('req.params /cars/:id', req.params)
   
    if (query) {
      res.json({ message: `Car has been deleted successfully ${id} ` }); 
    } else {
      res.status(404).json({ message: 'Car not deleted', data: null });
    }
  } catch(error) {
    
    res.status(500).json({ message: err, data: null });
  }
});

// Endpoint to update a car entry in the database
app.put('/cars/:id', async function(req,res) {
  try {
    const { id } = req.params; // Extracting 'id' from the request parameters
    const {make, model, year } = req.body;
  
    const query = await req.db.query(
      `UPDATE cars 
      SET make = :make, model = :model, year = :year
      WHERE id = :id `,
    
      {
        id,
        make,
        model,
        year,
      }
    );

     // Log query result for debugging
    
     console.log('SQL Query:', query);

     if (query) {
      res.status(200).send("Car data updated successfully");
    } else {
      res.status(400).send("Failed to update car data");
    }
  } catch (error) {
    res.status(500).send("Error updating car data: " + error.message);
  }
});

// Start the server and listen on the specified port
app.listen(port, () => console.log(`212 API Example listening on http://localhost:${port}`));