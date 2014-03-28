## Server Requests

![Request](../project_images/request_01.jpg?raw=true "Request")

Some nice progress today. After struggling with Python and Google App Engine I switched back to more familiar PhantomJS/nodejs combo.

You can now type an address and get visualization of a request to that page.

Here is a demo video http://youtu.be/ipwzKb2foME

What you see is stream of files served to you ordered by time of each request.

## Colors

Red - data
Orange - images
Green - html & css
Blue - code
Purple - video

      if mimeType.indexOf('javascript') != -1 || mimeType.indexOf('ecmascript') != -1
        hue = 0.57 #code
      if mimeType.indexOf('html') != -1 || mimeType.indexOf('css') != -1
        hue = 0.37 #ui
      if mimeType.indexOf('image') != -1
        hue = 0.09 #images
      if mimeType.indexOf('flash') != -1 || mimeType.indexOf('video') != -1
        hue = 0.8 #video
      if mimeType.indexOf('json') != -1 || mimeType.indexOf('xml') != -1 || mimeType.indexOf('text/plain') != -1
        hue = 0.09 #data

Additionaly each request that set's a cooki in your browser is highlighted with red frame.

## Live demo

You can see the it live here:
[http://marcinignac.com/projects/you-are-the-data/lab/03_request/](http://marcinignac.com/projects/you-are-the-data/lab/03_request/)
