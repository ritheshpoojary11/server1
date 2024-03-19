// const express = require('express');
// const Joi = require('@hapi/joi'); //used for validation 
// const app = express();
// app.use(express.json());

// const movies = [
// {title: 'KGF', id: 1},
// {title: 'RRR', id: 2},
 
// {title: 'James', id: 3}
// ]
// //****READ Request Handlers***** 
// app.get('/', (req, res) => {
//     res.send('Welcome to REST API with Node.js!!');
// });

// app.get('/movies', (req,res)=> { res.send(movies);
// });

// app.get('/movies/:id', (req, res) => {
// const getmovie = movies.find(c => c.id === parseInt(req.params.id));

// if (!getmovie) res.status(404).send('<h2 style="font-family: Malgun Gothic; color: darkred;">Ooops... Cant find what you are looking for!</h2>'); res.send(getmovie);
// });

// //****CREATE Request Handler*** 
// app.post('/movies', (req, res)=> {

// const { error } = validateMovie(req.body);
//  if (error){
// res.status(400).send(error.details[0].message) 
// return;
// }
// const getmovie = {
// id: movies.length + 1, title: req.body.title
// };
// movies.push(getmovie); res.send(getmovie);
// });



// //UPDATE Request Handler 
// app.put('/movies/:id', (req, res) => {
// const movie = movies.find(c=> c.id === parseInt(req.params.id)); 
// if (!movie) res.status(404).send('Not Found!!');

// const { error } = validateMovie(req.body); 
// if (error){
// res.status(400).send(error.details[0].message);
//  return;
// }
 
// movie.title = req.body.title; 
// res.send(movie);
// });

// //DELETE Request Handler 
// app.delete('/movies/:id', (req, res) => {

// const getmovie = movies.find( c=> c.id === parseInt(req.params.id)); 
// if(!getmovie) res.status(404).send(' Not Found!!');

// const index = movies.indexOf(getmovie); 
// movies.splice(index,1);

// res.send(getmovie);
// });

// function validateMovie(getmovie) {
//     const schema = Joi.object({
//         title: Joi.string().min(3).required()
//     });
//     return schema.validate(getmovie);
// }
// //PORT ENVIRONMENT VARIABLE
// const port = process.env.PORT || 8080;
// app.listen(port, () => console.log(`Listening on port ${port}..`));
const express = require('express');
const Joi = require('@hapi/joi'); // Used for validation 
const app = express();
app.use(express.json());

// Sample movies data
let movies = [
    { title: 'KGF', id: 1 },
    { title: 'RRR', id: 2 },
    { title: 'James', id: 3 }
];

// Welcome message
app.get('/', (req, res) => {
    res.send('Welcome to the Movie REST API with Node.js!');
});

// Get all movies
app.get('/movies', (req, res) => {
    res.send(movies);
});

// Get a specific movie by ID
app.get('/movies/:id', (req, res) => {
    const movie = movies.find(c => c.id === parseInt(req.params.id));
    if (!movie) return res.status(404).send('Movie not found.');
    res.send(movie);
});

// Add a new movie
app.post('/movies', (req, res) => {
    const { error } = validateMovie(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    const movie = {
        id: movies.length + 1,
        title: req.body.title
    };
    console.log(movie);
    movies.push(movie);
    res.send(movie);
});

// Update an existing movie
app.put('/movies/:id', (req, res) => {
    const movie = movies.find(c => c.id === parseInt(req.params.id));
    if (!movie) return res.status(404).send('Movie not found.');

    const { error } = validateMovie(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    movie.title = req.body.title;
    res.send(movie);
});

// Delete a movie
app.delete('/movies/:id', (req, res) => {
    const movie = movies.find(c => c.id === parseInt(req.params.id));
    if (!movie) return res.status(404).send('Movie not found.');

    const index = movies.indexOf(movie);
    movies.splice(index, 1);

    res.send(movie);
});

// Function to validate movie schema
function validateMovie(movie) {
    const schema = Joi.object({
        title: Joi.string().min(3).required()
    });
    return schema.validate(movie);
}

// Define port and start the server
const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Listening on port ${port}...`));
