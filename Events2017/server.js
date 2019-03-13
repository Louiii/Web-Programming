'use strict';

const express = require('express');
var bodyParser = require('body-parser');
const app = express();
var fs = require('fs')
var path = require('path');

var cookieParser = require("cookie-parser");
app.use(cookieParser())

var bcrypt = require('bcryptjs')
var jwt = require('jsonwebtoken');

var secret = 'concertina'


app.use(express.static(path.join(__dirname, 'public')));


app.get('/events2017/venues', function(req, resp){
  resp.sendFile( __dirname + "/venues.json" );
})

app.get('/events2017/events', function(req, resp){
  resp.sendFile( __dirname + "/events.json" );
})

app.get('/events2017/index.html', function(req, resp){
  resp.sendFile( __dirname + "/index.html" );
})

app.get('/events2017/admin.html', function(req, resp){
	var currentToken = req.cookies['TOKEN'];
	console.log(currentToken);
	jwt.verify(currentToken, secret, function(err, decoded) {
	  if (err) {
	  	console.log('error');
	    resp.status(400).sendFile( __dirname + "/index.html" );
	  } else {
	  	console.log('__dirname=' + __dirname);
	  	resp.sendFile( __dirname + "/admin.html" );
	  }
	});


	/////////////////////////
	// if (currentToken==undefined) {
	// 	resp.sendFile( __dirname + "/index.html" );
	// } else {
 //  		resp.sendFile( __dirname + "/admin.html" );
	// }
// } else {
//   resp.sendFile( __dirname + "/index.html" );
// }
})


app.get('/events2017/events/get/:event_id', function(req, resp){
	event_id = req.params.event_id
	var eventsfile = require(__dirname + '/events.json');
    var required_event = require(__dirname + '/public/json_responses/no_such_event_error.json');
    for (var i = 0; i<eventsfile.events.length; i++) {
    	if(eventsfile.events[i].event_id == event_id){
    		required_event = eventsfile.events[i];
    	};
    };
	resp.send(JSON.stringify(required_event) );
})

app.get('/events2017/events/search?:query', function(req, resp){//search?q=music&l=San+Diego, /events2017/search?:date=value&keyword1=key1&etc.
	var query = require('url').parse(req.url,true).query;
	var eventsfile = require(__dirname + '/events.json');
	//console.log(query);
	//console.log(query.date, query.search);


	var date_value = 'null';
	var keywords = 'null';
	if (query.date != undefined) {
		date_value = query.date.substring(0,10);
		console.log(date_value);
	}
	if (query.search != undefined) {
		keywords = query.search.split();
	}
	if (keywords=='null'&&date_value=='null') {//if nothing is searched
	    resp.send({"events":eventsfile.events});//return the list of events
	} else {
		if(date_value!='null') {//if there is a date value, 
			var correct_date_events = [];
		    for (var i = 0; i<eventsfile.events.length; i++) {//make a list of all events on that date
		    	if(eventsfile.events[i].date.substring(0,10) == date_value){//make sure dates are the same format
		    		correct_date_events.push(eventsfile.events[i]);
		    	};
		    };
		    var both_date_and_search_list = [];
		    if (keywords != 'null') {
			    for (search_value of keywords) {
				    if (search_value!='') {
				    	for (var i = 0; i<correct_date_events.length; i++) {//make a list of events that satisfy that search value that are on the right date
					    	if (includes_string(correct_date_events[i], search_value)){
					    		both_date_and_search_list.push(correct_date_events[i]);
					    	};
					    }
					}
				}
			}
			if (both_date_and_search_list.length==0) {
				both_date_and_search_list = correct_date_events;
			}
		    if (correct_date_events.length==0){//if there are no event containing the search value on that date return "no_such_event_error.json"
		    	resp.send( JSON.stringify(require(__dirname + '/public/json_responses/no_such_event_error.json')) );
		    } else {
		    	resp.send({"events":both_date_and_search_list});//else return the list
		    }
	    } else {
			var search_list_no_date = [];
			for (search_value of keywords) {
				for (var i = 0; i<eventsfile.events.length; i++) {//make a list of events that satisfy that search value
			    	if (includes_string(eventsfile.events[i], search_value)){
			    		search_list_no_date.push(eventsfile.events[i]);
			    	};
			    }
			}
		    if (search_list_no_date.length == 0){//if there are no event containing the search value return "no_such_event_error.json"
		    	resp.send( JSON.stringify(require(__dirname + '/public/json_responses/no_such_event_error.json')) );
		    } else {
		    	resp.send({"events":search_list_no_date});//else return the list
		    }
		}
	 }
})

function includes_string(event, stringg) {//Cannot read property 'venue_id' of undefined
	if (event.title.toLowerCase().includes(stringg.toLowerCase())||event.venue.name.toLowerCase().includes(stringg.toLowerCase())||event.venue.town.toLowerCase().includes(stringg.toLowerCase())){//event.event_id.toLowerCase().includes(stringg.toLowerCase())||event.title.toLowerCase().includes(stringg.toLowerCase())||event.venue.name.toLowerCase().includes(stringg.toLowerCase())||event.venue.town.toLowerCase().includes(stringg.toLowerCase())){//||event.venues.venue_id.includes(stringg)||event.venues.postcode.includes(stringg)||event.url.includes(stringg)||event.blurb.includes(stringg)) {
		return true;
	} else {
		return false;
	}
}


app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({extended: true})); 




app.post('/events2017/venues/add', function(req, res) {
	var currentToken = req.cookies['TOKEN'];

	var query = require('url').parse(req.url,true).query;
	if (query.auth_token == undefined || query.auth_token != 'concertina') {
		res.send({
    	"error": "not authorised, wrong token"
    	});
	} else {
		//console.log(req.param(name));
		console.log("query.name");
		console.log(query.name);
		console.log(query.postcode);
		console.log(query.town);
		console.log(query.url);
		console.log(query.icon);
		var vname = '';
		var vpostcode = '';
		var vtown = '';
		var vurl = '';
		var vicon = '';
		if (query.name != undefined) {
			vname = query.name;
			console.log(vname);
		}
		if (query.postcode != undefined) {
			vpostcode = query.postcode;
		}
		if (query.town != undefined) {
			vtown = query.town;
		}
		if (query.url != undefined) {
			vurl = query.url;
		}
		if (query.icon != undefined) {
			vicon = query.icon;
		}




		jwt.verify(currentToken, secret, function(err, decoded) {
		  if (err) {
		  	console.log('error');
		    res.status(400).sendFile( __dirname + "/index.html" );
		  } else {
		  	console.log('WORKED!!');
		  	//resp.sendFile( __dirname + "/admin.html" );



			// var query = require('url').parse(req.url,true).query;
			if(query.name=='') {
				res.send({"error": "name required"});
			}

			var venue = {
					"name":vname,//required - rest optional
					"postcode":vpostcode,
					"town":vtown,
					"url":vurl,
					"icon":vicon,
				}
			console.log(venue);
		    //console.log(event);
		    var venuesfile = require(__dirname + '/venues.json');

		    console.log(venuesfile);//works
		    //venuesfile = JSON.parse(venuesfile);
		    //console.log(venuesfile.venues.length);
		    var count = 0;
		    for(var attr in venuesfile.venues){
		    	count++;
		    }
		    console.log(count);
		    var venue_id = "v_" + (count+1).toString();
		    console.log(venue_id);
		    //venue = {venue_id:venue};
		    // for (var i = count; i<count+1; i++) {
		    	venuesfile.venues[venue_id] = venue;
		    // }
		    //venuesfile = {"venues" : {venuesfile.venues, {venue_id:venue}}};
		    var stringVenues = JSON.stringify(venuesfile);
		    console.log(stringVenues);
		    filePath = __dirname + '/venues.json';
		    fs.writeFile(filePath, stringVenues, function(err) {
			    if(err) {
			        console.log(err);
			        res.send( JSON.stringify(require(__dirname + '/public/json_responses/cant_save_event_error.json')) );
			    } else {
			    	res.send( JSON.stringify(require(__dirname + '/public/json_responses/successfully_saved.json')) );
			    	console.log("The file was saved!");
			    }
			}); 	
		  }
		});
	}
});


// Example response (if auth_token not defined or incorrect)
	//     {
	//     "error": "not authorised, wrong token"
	//     }
	  
	// Similar error response if note all required parameters are present
	// Response code of 400 should be set in case of error
//var bodyParser = require('body-parser');




app.post('/events2017/events/add', function(req, res) {
	// Parameter auth_token (required)
	var currentToken = req.cookies['TOKEN'];
	console.log(currentToken);









	jwt.verify(currentToken, secret, function(err, decoded) {
	if (err) {
	  	console.log('error');
	    res.status(400).sendFile( __dirname + "/index.html" );
	} else {
		console.log('WORKED!!');





		var eventsfile = require(__dirname + '/events.json');
		var query = require('url').parse(req.url,true).query;

		if(query.event_id==''||query.title==''||query.venue_id==''||query.date=='') {
			res.send({"error": "missing required details"});
		}
		// var moment = require('moment');
		// var formats = [
		//     moment.ISO_8601,
		//     "MM/DD/YYYY  :)  HH*mm*ss"
		// ];
  //       if (!moment(query.date, formats, true).isValid()) {//if date is in the wrong form 
  //       	res.send({"error": "Invalid date format, use ISO8601"});
  //         //alert("Date not in ISO8601 format");//res.send({"error": "Date not in ISO8601 format"});//send error
  //       } else {


			for (var i = 0; i<eventsfile.events.length; i++) {//Overwrite previous event with that id
		    	if (eventsfile.events[i].event_id == query.event_id) {
		    		eventsfile.events.splice(i, 1);;
		    	};
		    };

			var venuesfile = require(__dirname + '/venues.json');
			var venue = {"venue_id":"doesnt exist"}
			//console.log(venuesfile.venues);
			var str = query.venue_id;
			if (venuesfile.venues.hasOwnProperty(str)) {
				venue = venuesfile.venues[str];
				venue["venue_id"] = str;
				//console.log(venue);
				var event = {
					"event_id":query.event_id,
					"title":query.title,
					"blurb":query.blurb,
					"date":query.date,
					"url":query.url,
					"venue":venue
					}
			    //console.log(event);
			    //console.log("TEST 2 " + eventsfile);
			    eventsfile.events.push(event);
			    var stringEvents = JSON.stringify(eventsfile);
			    //console.log(stringEvents);
			    filePath = __dirname + '/events.json';
			    fs.writeFile(filePath, stringEvents, function(err) {
				    if(err) {
				        console.log(err);
				        res.send( JSON.stringify(require(__dirname + '/public/json_responses/cant_save_event_error.json')) );
				    } else {
				    	res.send( JSON.stringify(require(__dirname + '/public/json_responses/successfully_saved.json')) );
				    	console.log("The file was saved!");
				    }
				}); 
			} else {//if venue id doesnt exist
				res.send(JSON.stringify(require(__dirname + '/public/json_responses/invalid_venueid_error.json')));
			}//format this response into invalid venue id ||||||| 
			//or! make it so that you can only add a selected venue to an event
		//}
	}
});

    // req.on('data', function(data) {
    //     body += data;
    // });
    // var body = JSON.stringify(event);
    // req.on('end', function (){
    //     fs.appendFile(filePath, body, function() {
    //         res.end();
    //     });
    // });
});
//give this function a venue in json form (req), and add this to the json file for venues
// app.post('/events2017/events/add', function(req, resp){
//   resp.sendFile()
// })





app.post('/authenticate', function(req, res) {
    filePath = __dirname + '/users.json';
	var users_var = require(filePath);
	var userexists = false;
	for (var i = 0 ; i < users_var.USERS.length; i++) {
		if(users_var.USERS[i].name == req.body.name){
			userexists = true;
            var password = req.body.password;
            var passwordHash = users_var.USERS[i].password;

            var ip = /129\.234\.+\d\d\d.\d\d\d/;//local ip address//var ip = "129.234.0.26"
	        bcrypt.compare(password, passwordHash, function(err, success) {
	            if (success) {
	                var token = jwt.sign({"IP":ip}, secret, {//app.get('superSecret'), {
	                    expiresIn: 7200
	                });
					res.cookie('TOKEN', token)//, { expires  : new Date(Date.now() + 9999999), httpOnly : true});
					console.log("password matched successfully");

					// var now = new Date();
					// var time = now.getTime();
					// time += 7200 * 1000;
					// now.setTime(time);
					// document.cookie = 
					//      'TOKEN=' + token + 
					//      '; expires=' + now.toGMTString() + 
					//      '; path=/';
					//console.log(req.cookies);
					//res.status(200).send({ , token: token});
	                //res.cookie("TOKEN", token.toString(), {expires: new Date(Date.now() + 9999999)});
	                res.json({
	                    success: true,
	                    message: 'Enjoy your token!',
	                    token: token
	                });
	                // res.sendFile( __dirname + "/admin.html" );
	            }
	            else {
	                res.status(401).json({
	                    success: false,
	                    message: 'Authentication failed.'
	                });
	            }
	        });
		}
	}
	if(!userexists) {
		res.status(401).json({
	        success: false,
	        message: 'Authentication failed.'
	    });
		// res.json({
  //           message: 'Not a user!',
  //       });
	}
});


// var port = 8090
// app.listen(port)

var server = app.listen(process.env.PORT || '8090', function() {
	console.log('App listening on port %s', server.address().port);
	console.log('Press Ctrl+C to quit');
});




