var data;
var coordsCount = 0;
$(document).ready(function(){
    var mediaQuery;

    // Retrieve the content from Google Spreadsheet
    url = "https://spreadsheets.google.com/feeds/list/1NNpOjxrhXcbXVgP9hCptv8Vtj8mztB91gUzX5U6sAAM/1/public/values?alt=json"
	$.getJSON(url, function(json){
        data = clean_google_sheet_json(json);
        modify_and_compile(data);
	});
    
 
    // Initialize Google Maps
     var mapOptions = {
      center: { lat: 34.069117, lng: -118.445170},
      zoom: 15,
      disableDefaultUI: true,
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_CENTER
      },
      scrollwheel: false
    };
    var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    map.panBy(-200, 0);
        
        
    var mapDiv = $("#map-canvas");
    var header = $('header');
    var container = $('#container');

    // Makes the map stay fixed but allow the divs with content still scroll
    $(window).scroll(function() {
        mediaQuery = window.matchMedia('all and (max-width: 582px)');
        if (mediaQuery.matches) {
            if( $(this).scrollTop() > header.height() + header.padding('top') + header.padding('bottom')) {  
                mapDiv.css({
                    "max-height": "145px",
                    "height": "145px",
                    "position": "fixed",
                    "left": "0px",                    
                    "top": "0px"                    
                });
                container.css({
                    "position": "relative",
                    "top": "145px"
                });                
            } else {
                mapDiv.css({
                    "position": "relative",
                });
                container.css({
                    "position": "relative",
                    "top": "0px"
                }); 
            }        
        } else {        
            // Todo: account for margins
            if( $(this).scrollTop() > header.height() + header.padding('top') + header.padding('bottom')) {  
                mapDiv.css({
                    "max-height": "",
                    "height": "",                
                    "position": "fixed",
                    "left": "0px",
                    "top": "0px"
                });
                container.css("top", "0");        
            } else {
                mapDiv.css({
                    "position": "relative",
                });
                container.css("top", "-100%");
            }
        }
    });
});
 
// Takes in template id, compiles the template to html using data json object
// and then inserts it into given div id
function compile_and_insert_html(template_id, div_id, data) {
	var template = _.template($(template_id).html());
	var template_html = template({
		'rows': data
	});
	$(div_id).html(template_html);
}
 
 
// takes in JSON object from google sheets and turns into a json formatted 
// this way based on the original google Doc
// [
// 	{
// 		'column1': info1,
// 		'column2': info2,
// 	}
// ]
function clean_google_sheet_json(data){
	var formatted_json = [];
	var elem = {};
	var real_keyname = '';
	$.each(data.feed.entry, function(i, entry) {
		elem = {};
		$.each(entry, function(key, value){
			// fields that were in the spreadsheet start with gsx$
			if (key.indexOf("gsx$") === 0) 
			{
				// get everything after gsx$
				real_keyname = key.substring(4);  
                elem[real_keyname] = value['$t'];
			}
		});
		formatted_json.push(elem);
	});
	return formatted_json;
}

// Format the JSON data from the Google Spreadsheet to be more suitable for our map:
//   Extracts multiple image URLS
//   Gets the longitude/latitude of each address so people can type addresses in common English
//   Geocoding is asynchronous so we use compile_and_insert_html as a callback function.
function modify_and_compile(places) {   
    geocoder = new google.maps.Geocoder();
    
    $.each(places, function(i, place) {
        place.images = place.images.split('\n');
        place.paragraphs = place.paragraphs.split('\n');
        
        geocoder.geocode({'address': place.address}, function (results, status) {
            place['latitude']  = results[0].geometry.location.k.toString();
            place['longitude'] = results[0].geometry.location.D.toString();           
            coordsCount++;
           
            if (coordsCount === places.length) {
                compile_and_insert_html('#template','#container',data);
            }
        });
    });  
}


// Jquery plugin
//   Returns the padding in px as an integer
$.fn.padding = function (direction) {
    
    var padding = this.css("padding-" + direction);
    var num = padding.match(/[0-9]+/)[0];
    var unit = padding.match(/[a-zA-Z]+/)[0];
    
    // No padding
    if (num === "") {
        return 0;
    }
    
    if (unit === "px") {
        return parseInt(num);
    }
    else {
        // do unit conversion from em to px...
    }
<<<<<<< HEAD
}
=======
}
>>>>>>> 9cd7c56d5b368f973b9700cd3acd1845ef87a11c
