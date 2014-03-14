# You are the data

## Authors
- Marcin Ignac [http://github.com/vorg](http://github.com/vorg)

## Description
We treat the web as a source, a place we get things from. With a single click the collective power of the servers in the cloud delivers an answer to any question. We accept it and move forward. But what have had just happend? 

I want the remove layers of abstraction covering a simple web page request. We leave traces, we constantly leave little bits of information, here and there, IP, ping, cookie, geolocation... 

For the web nowadays, we are the data.

## Link to Prototype
N/A

## Example Code

```
#one page, many different types of data
@mimeTypes = unique(@entries.map(getEntryMimeType)) 

#one page, many different servers
@servers = unique(@entries.map(getEntryUrl).map(urlToHostName))

#one page, many different organizations
@rootServers = unique(@servers.map(extractTopLevelDomain))
```

## Links to External Libraries

[Plask](http://plask.org "Plask") - multimedia programming environment  
[Pex](https://github.com/vorg/pex/ "Pex") - my WebGL engine for Plask and Web Browsers  
[Ghost.py](http://jeanphix.me/Ghost.py/ "Ghost.py") - webkit web client for Python  
[omggif](https://github.com/deanm/omggif "omggif") - gif encoder/decoder  
[sitename](https://github.com/disconnectme/sitename "sitename") - website’s canonical domain name resolver
