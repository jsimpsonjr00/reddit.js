/************************
*reddit:
*TYPE: OBJECT (singleton)
*/
var reddit  = (function ($){
//private stuff


/***********************************************************************************************
 *function: sendRequest(url,callback,postData)
 *@url: REQUIRED string - full URL you wish to send request to
 *@opts: REQUIRED map - options map specifying request type(POST/GET, SSL/Not, success/error handlers, etc.)
 *@postData: OPTIONAL - string - data as it would be appended to the end of the URL for GET data
 *RETURNS: No return. Fires callback when AJAX request completes.
 *         Parameter passed to callback will either be AJAX data (successful connection)
 *         or HTTP error Code.
 ***********************************************************************************************/
function sendRequest( thing, opts, postData ) {
	var defaultOpts = { //default Opts map
			type: 		"GET",
			ssl:		false,
			dataType:	"jsonp",
			jsonp: 		"jsonp",
			url:		"http://www.reddit.com/" + thing + ".json",
			data:		postData,
			headers:	{},
			xhrFields:	{},
			success: function ( data, xhr, status ) {
				console.log("Successful operation, but no success handler was specified.");
			},
			error: function (xhr, status, error) {
	        	$self.append("<h4>An Error Occurred</h4>");
	        },
	        timeout: (10 * 1000)
		};
	
	opts = $.extend( true, defaultOpts, opts );
	if( opts.ssl ) {
		opts.url = "https://ssl.reddit.com/" + thing + ".json";
	}
	
	if( postData ) {
        opts.headers["Content-type"] = 'application/x-www-form-urlencoded';
        if( postData.passwd ) {
        	opts.xhrFields.withCredentials = true;
        }
    }
	
	$.ajax( opts );
	/*{
        type: opts.type, //default to a get
        dataType: "jsonp", 
        url: url, 
        data: postData,
        xhrFields: XHRFields,
        headers: headers,
        jsonp: "jsonp",
        success: success,
        error: function (xhr, status, error) {
        	$self.append("<h4>An Error Occurred</h4>");
        },
        timeout: (20 * 1000)
    });
    */
	/*
    req.onreadystatechange = function () {
            if (req.readyState != 4) return;
            if (req.status != 200 && req.status != 304) {
                var errorCode = 'HTTP error: ' + req.status;
                callback(errorCode);
            }
            
            var response = JSON.parse(req.response)
            if (response.jquery){
                console.log(req.getAllResponseHeaders());
            }
            if(response.data && response.data.modhash){
                reddit.control.setModHash(response.data.modhash )
            }
            if(response.data && response.data.children && typeof callback =='function'){
                callback(response.data.children);
            }else if(response.data && typeof callback=='function'){
                callback(response.data);
            }else if(typeof callback== 'function'){
                callback(response);
            };
    }
    if (req.readyState == 4) return;
    var postString = parsePostData(postData);
    req.send(postString);
    */
};
    /***************************************************************************
     *User
     *TYPE: OBJECT
     *PROPERTIES:
     *@modHash: string. Required for making authenticated requests to Reddit API
     *@data: user object passed from Reddit. See Reddit API documentation
     ***************************************************************************/
    var user = {
        modHash : '',
        name: '',
        password: '',
        hasMail: '',
        data: {},
        setHasMail: function(hasmail){
            this.hasMail = hasmail;
        }
    }
	//public:
	var instance = {
	    get : {
	        fetchReddit : function(sr, count, callback){
	            var data = {},
	            	data.count = count ? count : '25';
	            var sub;
	            if(sr == 'frontpage') {
	                    sub = '';
	            }else {
	                    sub = 'r/' + sr + '/';
	            };
	            sendRequest( sub, { success: callback, data: data });
	        },
	        fetchById : function(type, id, callback){
	            var fullName = type + '_' + id;
	            sendRequest("by_id/" + fullName, { success: callback } );
	        },
	        fetchCommentsById : function(id, callback){
	            sendRequest( id, { success: callback });
	        },
	        myReddits: function(callback){
	            sendRequest("mine", { success: callback } );
	        },
	        defaultReddits: function(callback){
	            sendRequest("reddits/", { success: callback } );
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
	        retrieveMail: function(onlyNew, callback){
	            var url = 'message/inbox/';
	            sendRequest(url, function(msg){
	                var messages = [];
	                if(onlyNew && msg.length > 0){
	                    for(i=0;i<msg.length;i++){
	                        if(msg[i].data.new){
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
		        var logonURL = user;
		        
		        var postData = {
		            api_type: 'json',
		            user : user,
		            passwd : password
		        };
	            sendRequest(logonURL, {
	            	success: function(response){
		                /*if(chrome.cookies){
		                    chrome.cookies.set({
		                        url: 'http://www.reddit.com',
		                        name: 'reddit_session',
		                        domain: '.reddit.com',
		                        value: reddit.control.fetchModHash()
		                    })
		                }*/
		                console.log('login response');
		                console.log(response);
		                reddit.get.fetchProfile('me', callback, postData, true );
				        if(remember){
				            localStorage['userName'] = user;
				            localStorage['password'] = password;
				        };
			        }
	            });
		    },
		
		    markMailRead: function(mailId, callback){
		        var url = 'api/read_message/';
		        var postData =
		        {
		            api_type: 'json',
		            id: mailId,
		            uh: reddit.control.fetchModHash(),
		            jsonp: alert
		        };
		        sendRequest(url, { success: callback, data: postData } );
		        
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
		        return(user.modHash);
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