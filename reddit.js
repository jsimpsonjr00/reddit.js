/************************
*reddit:
*TYPE: OBJECT (singleton)
*/
var reddit  = (function ($){
//private stuff

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
    /***************************************************************************
     *User
     *TYPE: OBJECT
     *PROPERTIES:
     *@modHash: string. Required for making authenticated requests to Reddit API
     *@data: user object passed from Reddit. See Reddit API documentation
     ***************************************************************************/
    var authUser = {
        auth: {
        	modHash: null,
        	cookie: null
        },
        name: '',
        password: '',
        hasMail: '',
        data: {},
        setHasMail: function(hasmail){
            this.hasMail = hasmail;
        }
    };
    if( document.cookie ) {
    	authUser.auth.cookie = document.cookie; //$.parseJSON( document.cookie );
    }
    
	//public:
	var instance = {
	    get : {
	        fetchReddit : function(sr, count, callback){
	            var data = {},
	            	sub;
	            
	            if(sr == 'frontpage') {
	                sub = '';
	            }
	            else {
	                sub = 'r/' + sr + '/';
	            };
	            
	            data.count = count ? count : '25';
	            sendRequest( sub, { success: callback, data: data });
	        },
	        byId : function( id, callback ){
	            var fullName = (id instanceof Array) ? id.toString() : id;
	            sendRequest("by_id/" + fullName, { success: callback } );
	        },
	        fetchCommentsById : function(id, callback){
	            sendRequest( id, { success: callback });
	        },
	        commentByIds: function ( linkID, commentID, callback ) {
	        	sendRequest("comments/" + linkID + "/_/" + commentID, { success: callback } );
	        },
	        myReddits: function(callback){
	            sendRequest("mine", { success: callback } );
	        },
	        defaultReddits: function(callback){
	            sendRequest("reddits/", { success: callback } );
	        },
	        userName: function () {
	        	return authUser.name;
	        },
	        me: function () {
	        	sendProxyRequest( "api/me", {
	        		type: "GET"
	        	});
	        },
	        fetchProfile: function(user, callback){
	            var url;
	            if(user == 'me'){
	                url = 'api/me';
	            }else{
	                url = 'user/' + user + '/about';
	            }
	            sendRequest(url, { success: callback } );
	        },
	        privateMessages: function () {
	        	//send
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
	                }else{
	                    var messages = msg; 
	                }
	                callback(messages);
	            });
	        }
	    },
	        
	//reddit API functions
	    control : {
		    //log in function
		    login : function(user, password, remember, callback){
		    	//TODO: this URL doesn't work with the others
		        var postData = {
		           user : user,
		            passwd : password
		        };
		        sendProxyRequest( "api/login/" + user, {
	            	data: postData,
	            	success: function( data, xhr, status){
	            		if( data.json.errors.length == 0 ){
	            			authUser.auth = data.json.data; 
	            			/*if(chrome && chrome.cookies){
			                    chrome.cookies.set({
			                        url: 'http://www.reddit.com',
			                        name: 'reddit_session',
			                        domain: '.reddit.com',
			                        value: reddit.control.fetchModHash()
			                    });
			                }
			                */
	            			document["cookie"] = "reddit_session=" + data.json.data.cookie; //JSON.stringify( data.json.data );
			                console.log('login response');
			                console.log(data.json);
			                //reddit.get.fetchProfile('me', callback, postData, true );
					        if(remember){
					            localStorage['userName'] = user;
					            localStorage['password'] = password;
					            
					            user.name = user;
					            user.pass = password;
					        };
	            		}
	            		else {
	            			//invoke some sort of error case
	            		}
			        }
	            });
		    },
		    submit: function ( title, text, sub, kind, success ) {
		    	sendProxyRequest( "api/submit/", {
		    		data:	{
			    		title:		title,
			    		text:		text,
			    		sr:			sub,
			    		kind:		kind,
			    		uh:			authUser.auth.modhash,
			    		reddit_session: authUser.auth.cookie  //bypasses captcha
			    	},
		    		success: function ( data, xhr, status ) {
		    			console.log( data );
		    		},
		    		error:	function ( xhr, status, error ) {
		    			console.log( error );
		    		}
		    	});
		    },
		    compose: function () { //sends a direct message
		    	
		    },
		    readMessage: function(mailId, callback){
		        sendProxyRequest( 'api/read_message/', { 
		        	data: {
			            id: 		mailId,
			            uh: 		reddit.control.fetchModHash(),
			            jsonp: 		alert
			        },
			        success: callback
		        });
		    },
		    undreadMessage: function () {
		    	sendProxyRequest( 'api/unread_message/', { 
		        	data: {
			            id: 		mailId,
			            uh: 		reddit.control.fetchModHash(),
			            jsonp: 		alert
			        },
			        success: callback
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
		    setModHash : function(mh){
		        user.modHash = mh;
		    },
		    fetchModHash : function(){
		        return(authUser.auth.modhash);
		    },
		    setUserName : function(un){
		        user.modHash = un;
		    },
		    fetchUserName : function(){
		        return user.name;
		    },
		    setPassword : function(pw){
		        user.password = pw;
		    },
		    setUserData : function(ud){
		        user.data = ud;
		    },
		    fetchUserData : function(){
		        return user.data;
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