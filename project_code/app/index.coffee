pex = pex || require('./lib/pex')

harServer = 'http://node.variable.io:1337'

pex.require([], () ->
  { Platform, Window, IO } = pex.sys

  Window.create
    settings:
      width: 1024
      height: 512
      fullscreen: Platform.isBrowser

    init: () ->
      if Platform.isBrowser then @initHTML()
    initHTML: () ->
      introDialog = document.getElementById('introContainer')
      queryInput = document.getElementById('query')
      goBtn = document.getElementById('goBtn')

      queryInput.addEventListener('keydown', (e) ->
        if e.keyCode == 13
          makeQuery()
      )

      goBtn.addEventListener('click', () ->
        makeQuery()
      )

      makeQuery = () ->
        url = queryInput.value
        if !url
          alert('Please enter url')
          queryInput.focus()
        else
          request = harServer + '/' + encodeURIComponent(url)
          IO.loadTextFile(request, (response) ->
            console.log(response)
          )
    draw: () ->
)