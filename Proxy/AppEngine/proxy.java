/* ==========================================================
 * com.reddit.Proxy v 0.1
 * http://github.com/jsimpsonjr00/reddit.js
 * ==========================================================
 * Copyright 2012 James Simpson.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */

/*
 * 	Proxy - A simple proxy built for Google App Engine(GAE) in java. Setup the servlet to accept requests 
 * 		along the lines of reddit/proxy/* where * represents the api endpoint.
 * 
 *  GAE Dependencies:
 *  	com.google.appengine.api.urlfetch.* - includes URLFetchService, HTTPResponse, HTTPRequest objects
 *  
 *  Notes: Assumes clean inputs from the JS wrapper. Only passes the Cookie header from the servlet request.
 */
package com.reddit;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.BufferedReader;
import java.io.UnsupportedEncodingException;
import java.net.URL;
import java.util.Iterator;
import java.util.Map;
import java.util.List;
import java.util.jar.Attributes;
import java.net.URLEncoder;
import java.lang.StringBuffer;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.appengine.api.urlfetch.*;

public class Proxy extends HttpServlet {
	public void doPost(HttpServletRequest req, HttpServletResponse resp)
    throws IOException {
		sendProxyRequest( req, resp, HTTPMethod.POST );
	}
	public void doGet(HttpServletRequest req, HttpServletResponse resp)
    throws IOException {
		sendProxyRequest( req, resp, HTTPMethod.GET );
	}
	protected void sendProxyRequest( HttpServletRequest req, HttpServletResponse resp, HTTPMethod method ) throws IOException {
		String url;
		URLFetchService fetcher = URLFetchServiceFactory.getURLFetchService();
		HTTPResponse proxyResponse;
		HTTPRequest proxyRequest;
		PrintWriter out = resp.getWriter();
		
		try {
			// url = secure url + endpoint + query string
			url = "https://ssl.reddit.com" + req.getPathInfo() + "?" + req.getQueryString();
			proxyRequest = new HTTPRequest( new URL ( url ), method, FetchOptions.Builder.validateCertificate() );
			
			if( method == HTTPMethod.POST ) { //copy the POST body to the request if needed
				setPayload( req, proxyRequest );
			}
			proxyRequest.setHeader( new HTTPHeader ( "Cookie", req.getHeaders( "Cookie").toString() ) );
			proxyResponse = fetcher.fetch( proxyRequest );
						
			resp.setContentType("application/json");
			copyResponseHeaders( resp, proxyResponse );
			
			out.println( new String( proxyResponse.getContent() ) );
		}
		catch( Exception e ) {
			out.println( "{ \"error\": \"" + e.getMessage() + "\"}" );
		}
	}
	// Paramaters - servlet response to copy headers to from the supplied GAE fetch response
	protected void copyResponseHeaders( HttpServletResponse resp, HTTPResponse proxyResponse ) {
		List<HTTPHeader> headers = proxyResponse.getHeaders();
		HTTPHeader temp;
		for( int i = 0; i < headers.size(); i++ ) {
			temp = headers.get(i);
			resp.setHeader( temp.getName(), temp.getValue() );
		}
	}
	// Parameters - The servlet request and the fetch request sent to proxy
	protected void setPayload( HttpServletRequest req, HTTPRequest proxyRequest ) {
		try {
			BufferedReader reader = req.getReader();
			StringBuffer buffer = new StringBuffer();		
			String line = null;
			
			while ((line = reader.readLine()) != null) {
				buffer.append(line);
			}
			proxyRequest.setPayload( buffer.toString().getBytes() );
		} 
		catch (IOException e) {
			//do nothing
		}
	}
}