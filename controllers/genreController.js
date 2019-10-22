const validator = require('express-validator');
var Book = require('../models/book');
var async = require('async');
var Genre = require('../models/genre');

// Display list of all Genre.
exports.genre_list = function(req, res, next) {
        Genre.find()
          .sort([['name','ascending']])
          .exec(function (err, list_genre) {
            if (err) { return next(err); }
            //Successful, so render
            res.render('genre_list', { title: 'Genre List', genre_list: list_genre });
          });
      
      };

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res, next) {

    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id)
              .exec(callback);
        },

        genre_books: function(callback) {
            Book.find({ 'genre': req.params.id })
              .exec(callback);
        },

    }, function(err, results) {
        if (err) { return next(err); }
        if (results.genre==null) { // No results.
            var err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render
        res.render('genre_detail', { title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books } );
    });

};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res, next) {     
    res.render('genre_form', { title: 'Create Genre' });
  };

// Handle Genre create on POST.
exports.genre_create_post =  [
   
    // Validate that the name field is not empty.
    validator.body('name', 'Genre name required').isLength({ min: 1 }).trim(),
    
    // Sanitize (escape) the name field.
    validator.sanitizeBody('name').escape(),
  
    // Process request after validation and sanitization.
    (req, res, next) => {
  
      // Extract the validation errors from a request.
      const errors = validator.validationResult(req);
  
      // Create a genre object with escaped and trimmed data.
      var genre = new Genre(
        { name: req.body.name }
      );
  
  
      if (!errors.isEmpty()) {
        // There are errors. Render the form again with sanitized values/error messages.
        res.render('genre_form', { title: 'Create Genre', genre: genre, errors: errors.array()});
        return;
      }
      else {
        // Data from form is valid.
        // Check if Genre with same name already exists.
        Genre.findOne({ 'name': req.body.name })
          .exec( function(err, found_genre) {
             if (err) { return next(err); }
  
             if (found_genre) {
               // Genre exists, redirect to its detail page.
               res.redirect(found_genre.url);
             }
             else {
  
               genre.save(function (err) {
                 if (err) { return next(err); }
                 // Genre saved. Redirect to genre detail page.
                 res.redirect(genre.url);
               });
  
             }
  
           });
      }
    }
  ];

// Display Genre delete form on GET.
exports.genre_delete_get = function(req, res, next) {
    async.parallel({
      genre: function(callback){
        Genre.findById(req.params.id).exec(callback)
      },
      books: function(callback) {
        Book.find({ 'genre':req.params.id}).exec(callback)
      },
}, function(err, results) {
    if (err) {return next(err);}
    if (results.genre==null) {res.redirect('catalog/genres')}

res.render('genre_delete', {title: 'Delete Genre', genre: results.genre, book_genre: results.books});
    });
};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res, next) {
    async.parallel({
      genre: function(callback) {
        Genre.findById(req.body.genreid).exec(callback)
      },
      book_genre: function(callback){
        Book.find({'genre': req.body.genreid}).exec(callback)
      },
    },
      function(err, results){
        if (err) {return next(err);}
        if(results.book_genre.length > 0){
          res.render('genre_delete', {title: 'Delete Genre', genre: results.genre, book_genre: results.book_genre})
          return;
        }
        else {
          Genre.findByIdAndRemove(req.body.genreid, function deleteGenre(err){
            if (err) {return next (err);}
            res.redirect('catalog/genre')
        })
      }
    });
};

// Display Genre update form on GET.
exports.genre_update_get = function(req, res) {
    async.parallel({
      genre: function(callback) {
        Genre.findById(req.params.id).populate('book').exec(callback);
      },
      book: function(callback){
        Book.find(callback);
      },
    },
    function(err, results) {
      if (err) { return next(err);}
      if (results.genre==null){
        //no results
        var err = new Error('Genre not found');
        err.status = 404;
        return next(err);
      }
      for (var all_g_iter = 0; all_g_iter < results.genres.length; all_g_iter++) {
        for (var book_g_iter = 0; book_g_iter < results.book.genre.length; book_g_iter++) {
            if (results.genres[all_g_iter]._id.toString()==results.book.genre[book_g_iter]._id.toString()) {
                results.genres[all_g_iter].checked='true';
            }
        }
    }
    res.render('genre_form', { title: 'Update Genre', genres: results.genres, book: results.book });
    });
};

// Handle Genre update on POST.
exports.genre_update_post =   [  // Validate that the name field is not empty.
  validator.body('name', 'Genre name required').isLength({ min: 1 }).trim(),

// Sanitize (escape) the name field.
  validator.sanitizeBody('name').escape(),

// Process request after validation and sanitization.
  (req, res, next) => {

  // Extract the validation errors from a request.
  const errors = validator.validationResult(req);

  // Create a genre object with escaped and trimmed data.
  var genre = new Genre(
    { name: req.body.name,
      _id:req.params.id }
  );


  if (!errors.isEmpty()) {
    // There are errors. Render the form again with sanitized values/error messages.
    res.render('genre_form', { title: 'UpdateGenre', genre: genre, errors: errors.array()});
    return;
  }
  else {
    // Data from form is valid.
    // Check if Genre with same name already exists.
    Genre.findOne({ 'name': req.body.name })
      .exec( function(err, found_genre) {
         if (err) { return next(err); }

         if (found_genre) {
           // Genre exists, redirect to its detail page.
           res.redirect(found_genre.url);
         }
         else {

           genre.findByIdAndUpdate(function (err) {
             if (err) { return next(err); }
             // Genre saved. Redirect to genre detail page.
             res.redirect(genre.url);
           });

         }

       });
  }
}
];