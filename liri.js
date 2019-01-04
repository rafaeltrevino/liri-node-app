require("dotenv").config();
var keys = require("./keys.js");
var Spotify = require("node-spotify-api");
var inquirer = require("inquirer");
var axios = require("axios");
var moment = require('moment');
var fs = require("fs");

// Create a function that logs search results to log.txt
var logResponse = function(result) {
    fs.appendFile("./log.txt", result, 'utf8', function(err){
        if (err) {
            console.log("Error occurred:  " + err);
        };
    });
};

// Create a function that performs searches on a database based on the database and searchTerm requested and logs results
var searchDatabase = function(database, searchTerm) {
    switch (database) {
        case "concert-this":
            var queryUrl = "https://rest.bandsintown.com/artists/" + searchTerm + "/events?app_id=codingbootcamp";
            axios.get(queryUrl).then(function(bandsintownResponse) {
                console.log("\nUpcoming concerts for " + searchTerm + ":\n");
                logResponse("\nUpcoming concerts for " + searchTerm + ":\n");
                for (key in bandsintownResponse.data) {
                    var num = parseInt(key) + 1;
                    var venueName = bandsintownResponse.data[key].venue.name;
                    var venueCity = bandsintownResponse.data[key].venue.city;
                    var venueDate = moment(bandsintownResponse.data[key].datetime).format("MM/DD/YYYY");
                    var result = num + ". " + venueDate + " | " + venueCity + ": " + venueName;
                    console.log(result);
                    logResponse("\n" + result);
                };
            });
            break;
        case "spotify-this-song":
            var spotify = new Spotify(keys.spotify);
            spotify.search({ type: 'track', query: searchTerm }, function(err, data) {
                if (err) {
                    return console.log("Error occurred: " + err);
                };
                for (key in data.tracks.items) {
                    var artist = data.tracks.items[key].album.artists[0].name;
                    var link = data.tracks.items[key].external_urls.spotify;
                    var albumName = data.tracks.items[key].name;
                    var result = "\n“" + searchTerm + '”' + " by " + artist + "\nAlbum: " + albumName + " \nLink: " + link;
                    console.log(result);
                    logResponse("\n" + result);
                };
            });
            break;
        case "movie-this":
            var queryUrl = "http://www.omdbapi.com/?t=" + searchTerm + "&y=&plot=short&apikey=trilogy";
            axios.get(queryUrl)
                .then(function(movieResponse) {
                    var movie = movieResponse.data;
                    var result = "\n\t" + movie.Title + " (" + movie.Year + "), featuring " + movie.Actors + ": " + movie.Plot + " The movie was released in " + movie.Country + " and is available to audiences in " + movie.Language + ". The Interview Movie Database gives this movie a " + movie.Ratings[0].Value + " while Rotten Tomatoes rates it at " + movie.Ratings[1].Value + ".\n";
                    console.log(result);
                    logResponse("\n" + result);
                });
            break;
    };
};
    
// Prompt the user for which database they would like to search
inquirer.prompt([{
    type: "list",
    message: "What would you like to do?",
    choices: ["concert-this", "spotify-this-song", "movie-this", "do-what-it-says"],
    default: "concert-this",
    name: "userDo"
}]).then(function(response) {
    // Pass the random.txt information to the searchDatabase function if user selects "do-what-it-says"
    if (response.userDo == "do-what-it-says") {
        fs.readFile("./random.txt", "utf8", function(err, data) {
            if (err) {
                return console.log("Error occurred: " + err);
            };
            var database = data.split(",")[0];
            var searchTerm = data.split(",")[1];
            // Start a section in the log file for the results and stamp with date and time
            var datetime = new Date();
            logResponse("\n\n====== " + datetime + " =====\nDatabase: " + database + "\n");
            searchDatabase(database, searchTerm);
        });
    // Otherwise, pass the user's own selections to the searchDatabase function to conduct the search
    } else {
        inquirer.prompt([{
            type: "input",
            message: "Who or what would you like to search for?",
            name: "searchTerm"
        }]).then(function(searchResponse) {
            // Start a section in the log file for the results and stamp with date and time
            var datetime = new Date();
            logResponse("\n\n====== " + datetime + " =====\nDatabase: " + response.userDo + "\n");
            // Pass through default values if the searchTerm prompt is blank
            if (searchResponse.searchTerm == "" && response.userDo == "concert-this") {
                searchDatabase(response.userDo, "Enrique Iglesias");
            } else if (searchResponse.searchTerm == "" && response.userDo == "spotify-this-song") {
                searchDatabase(response.userDo, "The Sign");
            } else if (searchResponse.searchTerm == "" && response.userDo == "movie-this") {
                searchDatabase(response.userDo, "Mr. Nobody");
            // Otherwise, the user's searchTerm is used
            } else {
                searchDatabase(response.userDo, searchResponse.searchTerm);
            }
        });
    }
});