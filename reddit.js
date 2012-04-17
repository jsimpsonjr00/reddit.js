/************************
*	reddit:
*	TYPE: OBJECT (singleton)
*
*	Notes: Object methods based upon the endpoints defined at http://www.reddit.com/dev/api/
*/
var reddit  = (function ($){
//private stuff
	
	/***************************************************************************
     * AuthUser
     * TYPE: Singleton Object which holds currently authenticated user properties and methods
     * PROPERTIES:
     *
     ***************************************************************************/
    var authUser = {
        reddit_session: document.cookie ? document.cookie : null,
        me: {}, //store the return of /api/me here
        getUserData: function ( data ) {
        	return this.me;
        },
        setUserData: function ( data ) {
        	this.me = data;
        },
        getModhash: function () {
        	return this.me.modhash;
        },
        setModhash: function(mh){
	        this.me.modhash = mh;
	    },
        setHasMail: function(hasmail) {
            this.hasMail = hasmail;
        }
    };
    
    $(document).ready( function () {
    	loadMeFromSession();
    });
    
function loadMeFromSession() {
    var cookie = authUser.reddit_session;
	
	if( cookie ) {
		var splitCookie = cookie.split(";");
		var hasSession = false;
		for( var i = 0; i < splitCookie.length; i++ ) {
			var pair = $.trim( splitCookie[i] ).split("=");
			
			if( pair[0] == "reddit_session" ) {
				hasSession = true;
				break;
			}
		}
		
		if( hasSession ) {
			reddit.get.me();
		}
		else {
			//TODO: something indicating the session doesn't exist
		}
	}
};
/*
 *  sendProxyRequest - executes a request via a proxy necessary for auth operations such as messages, login, etc.
 */
function sendProxyRequest ( thing, opts ) {
	var defaultOpts = { //default Opts map for Proxy requests
			type:		"POST",
			dataType:	"json",
			url:		"http://localhost:8888/reddit/proxy/" + thing + ".json", //The proxy server
		};
	opts = $.extend( true, defaultOpts, opts );
	sendRequest( thing, opts );
}
/***********************************************************************************************
 *function: sendRequest(url,callback,postData)
 *@thing: REQUIRED string - thing being requested(the path after reddit.com/ less extension). queryString paramters go in opts.data
 *@opts: REQUIRED map - options map specifying request type(POST/GET, SSL/Not, success/error handlers, etc.)
 *RETURNS: No return. Fires callback when AJAX request completes.
 *         Parameter passed to callback will either be AJAX data (successful connection)
 *         or HTTP error Code.
 ***********************************************************************************************/
function sendRequest( thing, opts ) {
	var defaultOpts = { //default Opts map, for anon GET requests primarily
			type: 		"GET",
			dataType:	"jsonp",
			jsonp: 		"jsonp",
			url:		"http://www.reddit.com/" + thing + ".json",
			data:		{
				api_type: 	"json" //ask for a json response
			},
			headers:	{},
			xhrFields:	{},
			success: function ( data, xhr, status ) {
				console.log("Successful operation, but no success handler was specified.");
				console.log( data );
			},
			error: function (xhr, status, error) {
				console.log("Error occured: " + error + ". No error handler defined.");
	        },
	        timeout: (10 * 1000)
		};
	
	opts = $.extend( true, defaultOpts, opts );
	
	if( opts.type == "POST" ) {
        opts.headers["Content-type"] = 'application/x-www-form-urlencoded';
        if( opts.data.passwd ) {
        	opts.xhrFields.withCredentials = true;
        }
    }
	
	$.ajax( opts );
};
    
    
	//public:
	var instance = {
		requireLogin: function ( success, error ) {
			//TODO: validate the authUser is logged in, then callback to either success or error
		},
	    get : {
	        fetchReddit : function(sr, count, callback){
	            var sub = (sr == 'frontpage') ? "" : ("r/" + sr);
	            
	            sendRequest( sub, { 
	            	success: callback, 
	            	data: {
	            		count: count ? count : 25
	            	} 
	            });
	        },
	        byId: function( id, callback ) { //Get Links by ID, accepts an String[] or String
	            var fullName = (id instanceof Array) ? id.toString() : id;
	            sendRequest("by_id/" + fullName, { 
	            	success: callback 
	            });
	        },
	        commentsById: function( id, callback ) {
	            sendRequest( id, { 
	            	success: callback 
	            });
	        },
	        commentByIds: function ( linkID, commentID, callback ) {
	        	sendRequest("comments/" + linkID + "/_/" + commentID, { 
	        		success: callback 
	        	});
	        },
	        
	        me: function ( callback ) {
	        	sendProxyRequest( "api/me", {
	        		type: "GET",
	        		success: function ( data, xhr, status ) {
	        			if( data.data ) {
	        				authUser.setUserData( data.data );
	        				callback ? callback.apply( reddit,  [ data, xhr, status] ) : null;
	        			}
	        			else {
	        				//TODO: this is an error case where there is not a valid cookie
	        			}
	        		}
	        	});
	        },
	        userAbout: function ( user, callback ) {
	        	sendRequest("user/" + user + "/about", { 
	        		success: callback 
	        	});
	        },
	        privateMessages: function () {
	        	
	        },
	        retrieveMail: function(onlyNew, callback){
	            var url = 'message/inbox/';
	            sendRequest(url, function(msg){
	                var messages = [];
	                if(onlyNew && msg.length > 0){
	                    for(i=0;i<msg.length;i++){
	                        if( msg[i].data["new"] ){
	                            messages.push(msg[i]);
	                        }
	                    }
	                } else{
	                    var messages = msg; 
	                }
	                callback(messages);
	            });
	        }
	    },
	    //Functions to handle endpoints starting /reddits/
	    reddits: {
	        Default: function(callback){
	            sendRequest("reddits/", { 
	            	success: callback 
	            });
	        },
	    	mine: {
	    		where: function ( where, callback ) {
	    			sendProxyRequest("reddits/mine/" + where, { 
		            	success: callback 
		            });
	    		},
	    		subscriber: function ( callback ) {
	    			reddit.reddits.mine.where( "subscriber", callback );
		        },
		        contributer: function ( callback ) {
	    			reddit.reddits.mine.where( "contributer", callback );
		        },
		        moderator: function ( callback ) {
	    			reddit.reddits.mine.where( "moderator", callback );
		        }
	    	},
	        popular: function ( callback ) {
	        	sendRequest("reddits/popular", { 
	            	success: callback 
	            });
	        },
	        New: function ( callback ) {
	        	sendRequest("reddits/new", { 
	            	success: callback 
	            });
	        },
	        banned: function ( callback ) {
	        	sendProxyRequest("reddits/banned", { 
	            	success: callback 
	            });
	        }
	    },
	    //functions to handle endpoints starting /message/
	    message: {
	    	readMessage: function (mailID, callback) {
		        sendProxyRequest( 'api/read_message/', { 
		        	data: {
			            id: 		mailID,
			            uh: 		authUser.getModhash(),
			            jsonp: 		alert
			        },
			        success: callback
		        });
		    },
		    unreadMessage: function ( mailID, callback ) {
		    	sendProxyRequest( 'api/unread_message/', { 
		        	data: {
			            id: 		mailID,
			            uh: 		authUser.getModhash(),
			            jsonp: 		alert
			        },
			        success: callback
		        });
		    },
		    compose: function () { //sends a direct message
		    	
		    },
		    inbox: function () {
		    	
		    },
		    sent: function () {
		    	
		    },
		    unread: function () {
		    	
		    }
	    },
	    //functions dealing with link and comment endpoints
	    link: {
	    	action: function ( action, id, callback ) { //generic link action function used by several actions, which may be bypassed
	    		sendProxyRequest ( "api/" + action, {
	    			data: {
	    				id:	id,
	    				uh:	authUser.getModhash()
	    			},
	    			success: callback
	    		});
	    	},
	    	comment: function ( id, text, comment, callback ) {
	    		sendProxyRequest( "api/comment", {
	    			data: {
	    				id: 		id,
	    				text:		text,
	    				comment:	comment,
	    				uh:			authUser.getModhash()
	    			},
	    			success: callback
	    		});
	    	},
	    	editUserText: function ( id, text, callback ) {
	    		sendProxyRequest( "api/editusertext" {
	    			data: {
	    				id:		id,
	    				text:	text,
	    				uh:		authUser.getModhash()
	    			},
	    			success: callback
	    		});
	    	},
	    	hide: function ( id, callback ) {
	    		reddit.link.action( "hide", id, callback );
	    	},
	    	info: function ( id, limit, url, callback ) {
	    		//TODO: implement
	    	},
	    	marknsfw: function ( id, callback ) {
	    		reddit.link.action( "marknsfw", id, callback );
	    	},
	    	morechildren: function ( id, callback ) {
	    		//TODO: implement
	    	},
	    	report: function ( id, callback ) {
	    		reddit.link.action( "report", id, callback );
	    	},
	    	save: function ( id, callback ) {
	    		reddit.link.action( "save", id, callback );
	    	},
	    	submit: function ( title, text, sub, kind, success ) {
		    	sendProxyRequest( "api/submit/", {
		    		data:	{
			    		title:		title,
			    		text:		text,
			    		sr:			sub,
			    		kind:		kind,
			    		uh:			authUser.getModhash()//auth.modhash
			    	},
		    		success: function ( data, xhr, status ) {
		    			console.log( data );
		    			success ? success.apply( reddit, [data, xhr, status] ) : null;
		    		},
		    		error:	function ( xhr, status, error ) {
		    			console.log( error );
		    		}
		    	});
		    },
		    unhide: function ( id, callback ) {
		    	reddit.link.action( "unhide", id, callback );
	    	},
	    	unmarknsfw: function ( id, callback ) {
	    		reddit.link.action( "unmarknsfw", id, callback );
	    	},
	    	unsave: function ( id, callback ) {
	    		reddit.link.action( "unsave", id, callback );
	    	}
	    },
	    post: {
	    	submit: function ( title, text, sub, kind, success ) {
		    	sendProxyRequest( "api/submit/", {
		    		data:	{
			    		title:		title,
			    		text:		text,
			    		sr:			sub,
			    		kind:		kind,
			    		uh:			authUser.getModhash()//auth.modhash
			    	},
		    		success: function ( data, xhr, status ) {
		    			console.log( data );
		    			success ? success.apply( reddit, [data, xhr, status] ) : null;
		    		},
		    		error:	function ( xhr, status, error ) {
		    			console.log( error );
		    		}
		    	});
		    }
	    },
	//reddit API functions
	    control : {
		    //log in function
		    login : function(user, password, remember, callback){
		    	sendProxyRequest( "api/login/" + user, {
	            	data: {
	 		        	user: 	user,
			            passwd: password
			        },
	            	success: function( data, xhr, status){
	            		if( data.json.errors.length == 0 ){
	            			authUser.reddit_session = data.json.data.cookie; 
	            			authUser.setModhash( data.json.data.modhash );
	            			
	            			//Set a cookie and get me
	            			var now = new Date(),
	            				years = (1000*60*60*24*365*10),
	            				expires = new Date( now.getTime() + years ).toUTCString().replace( "GMT", "UTC");
	            			
	            			document.cookie = "Domain=" + document.domain;
	            			document.cookie = "path=" + "/";
	            			document.cookie = "reddit_session=" + encodeURIComponent(data.json.data.cookie);
	            			document.cookie = "expires=" +  expires;//set cookie with 10 year expiration
	            			reddit.get.me();
	            		}
	            		else {
	            			//TODO: invoke some sort of error case
	            		}
			        }
	            });
		    },
		    upVote : function(id, callback){
		
		    },
		    downVote : function(id, callback){
		
		    },
		    //error handler
		    handleError : function(error){
		        console.log(error);
		    },
		    fetchUserData : function(){
		        return authUser.getUserData();
		    },
		    setLastRequestData: function(data){
		        reddit.control.lastRequestData = data;
		    },
		    fetchLastRequestData: function(){
		        return reddit.control.lastRequestData;
		    },
		    fetchHasMail: function(){
		        return user.hasMail;
		    }
	    }
	}
    return (instance);
})(jQuery);