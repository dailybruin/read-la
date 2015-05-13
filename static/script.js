var data;
var place_array;
var xoffset = 0;
var spreadsheet_url = "https://spreadsheets.google.com/feeds/list/1NNpOjxrhXcbXVgP9hCptv8Vtj8mztB91gUzX5U6sAAM/1/public/values?alt=json";
$(document).ready(function(){
    var mediaQuery = window.matchMedia('all and (max-width: 582px)');
 
    // Retrieve the content from Google Spreadsheet.
    // Geocoding the locations (getting lat/lng from the common location name) is asynchronous
    // so we need to do a callback.  Put everything that depends on the map and place divs in
    // the callback() function below.
	$.getJSON(spreadsheet_url, function(json){
        data = clean_google_sheet_json(json);
        modify_and_compile(data, callback);
	});
    
    function callback() {
        // Generate the actual html and divs from the JSON.
        compile_and_insert_html('#template','#container',data);

        if (mediaQuery.matches) {
            xoffset = 0;
            console.log("TRUE");
        }
        else {
            xoffset = -((window.innerWidth / 2) - (window.innerWidth - $("#container").width()) / 2);
        }
       
        //------- Initialize Google Maps -----------  
        // Center map to the first location automatically.
        var center = {lat: parseFloat($('#place1').attr("data-latitude")), 
                      lng: parseFloat($('#place1').attr("data-longitude"))};
        var mapOptions = {
          center: center,
          zoom: 14,
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER
          },
          scrollwheel: false
        };
        var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
        map.panBy(xoffset, 0);
        
        // Create markers and waypoints for each place.
        var places_array = $('.place');
        var waypoint_array = [];
        $.each(places_array, function(i, place) {
            var latlng = new google.maps.LatLng(parseFloat($('#place' + (i + 1)).attr('data-latitude')), parseFloat($('#place' + (i + 1)).attr('data-longitude')));
            
            var marker = new google.maps.Marker({
                position: latlng,
                map: map,
                title: (i + 1).toString()
            });
            
            // Makes clicking a marker scroll to the post.
            var scrolltime = 500;
            google.maps.event.addListener(marker, 'click', function () {
                Waypoint.disableAll();
                //map.panTo(latlng);
                //map.panBy(-225.5, 0);
                map.panToWithOffset(latlng, xoffset, 0);
                setTimeout(function(){ Waypoint.enableAll();}, scrolltime);
                $('html, body').animate({
                    scrollTop: $("#place" + (i+1)).offset().top
                }, scrolltime);
            });
            
            waypoint_array[i] = (function(latlng) {
                var waypoint = new Waypoint({
                    element: document.getElementById('place' + (i+1)),
                    handler: function() {
                        map.panToWithOffset(latlng, xoffset, 0);
                    },
                  offset: '50%'

                }); 
                return waypoint;
            })(latlng);
        });
    }
 
    
    // Makes the map stay fixed but allow the divs with content still scroll
    var mapDiv = $("#map-canvas");
    var header = $('header');
    var container = $('#container');
    $(window).scroll(function() {
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
// Asynchronous, needs a callback.
function modify_and_compile(places, callback) {   
    var num_places_processed = 0;

    var geocoder = new google.maps.Geocoder();
    
    $.each(places, function(i, place) {
        place.images = place.images.split('\n');
        place.paragraphs = place.paragraphs.split('\n');
        
        // geocode() is ansynchronous so we need to able to keep track
        //   of when it finished and do a callback.
        geocoder.geocode({'address': place.address}, function (results, status) {
            // Note: the 'k' and 'D' to represent lat/long may change with the Google maps API
            place['latitude']  = results[0].geometry.location.k.toString();
            place['longitude'] = results[0].geometry.location.D.toString();           
            num_places_processed++;

            // Finished processing
            if (num_places_processed === places.length) {
                callback();
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
}

//pantowithoffset function
google.maps.Map.prototype.panToWithOffset = function(latlng, offsetX, offsetY) {
    var map = this;
    var ov = new google.maps.OverlayView();
    ov.onAdd = function() {
        var proj = this.getProjection();
        var aPoint = proj.fromLatLngToContainerPixel(latlng);
        aPoint.x = aPoint.x+offsetX;
        aPoint.y = aPoint.y+offsetY;
        map.panTo(proj.fromContainerPixelToLatLng(aPoint));
    }; 
    ov.draw = function() {}; 
    ov.setMap(this); 
};