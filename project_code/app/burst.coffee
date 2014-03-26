pex = pex || require('./lib/pex')

{ IO, Window, Platform } = pex.sys
{ PerspectiveCamera, Scene, Arcball } = pex.scene
{ SolidColor, Diffuse, ShowDepth } = pex.materials
{ Mesh } = pex.gl
{ Cube } = pex.geom.gen
{ Vec3, hem } = pex.geom
{ Color } = pex.color
{ MathUtils, Time, MovieRecorder } = pex.utils
{ randomVec3, seed, map, randomFloat } = MathUtils
fx = pex.fx

unique = (array) ->
  array.sort().filter((e, i, arr) -> arr.lastIndexOf(e) == i)

getEntryMimeType = (entry) ->
  entry.response.content.mimeType

getEntryUrl = (entry) ->
  entry.request.url

urlToHostName = (() ->
  if Platform.isPlask
    url = require('url')
    (s) -> url.parse(s).hostname
  else if Platform.isBrowser
    a = document.createElement("a")
    (s) ->
      a.href = s;
      a.hostname || s
  else (s) -> s
)()

extractTopLevelDomain = (domain) ->
  domain.match(/[^\.]+\.[^\.]+$/)[0]

# adds leading zeros to a number until certain length is met
pad = (num, char, len) ->
  s = '' + num
  while s.length < len
    s = char + s
  s


pex.require(['materials/CorrectedGamma', 'fx/Fog', 'fx/TonemapLinear', 'fx/TonemapReinhard', 'fx/TonemapUncharted', 'fx/TonemapRichard', 'lib/timeline'], (CorrectedGamma, Fog, TonemapLinear, TonemapReinhard, TonemapUncharted, TonemapRichard, timeline) ->
  Window.create
    settings:
      width: 1024
      height: 512
      fullscreen: Platform.isBrowser
    init: () ->
      seed(0)

      if Platform.isPlask then @recorder = new MovieRecorder('screenshots')
      if Platform.isBrowser then @gl.getExtension("OES_texture_float")

      @initScene()
      @loadData()

      @needsScreenshot = false
      @on('keyDown', (e) =>
        if e.str == 'S'
          @needsScreenshot = true
      )


    initScene: () ->
      @instances = []
      @camera = new PerspectiveCamera(60, @width / @height)
      @scene = new Scene()
      #@arcball = new Arcball(this, @camera)
      @camera.target = new Vec3(0, 0, -20)

      @bgColor = Color.create(0.15*0.9, 0.18*0.9, 0.226*0.9, 1)

    loadData: () ->
      #IO.loadTextFile('http://localhost:1337/https%3A%2F%2Fdevart.withgoogle.com%2F%23%2Fproject%2F17602419%3Fq%3Dyou%2520are', (data) =>
      #IO.loadTextFile('http://localhost:1337/http%3A%2F%2Fmarcinignac.com/', (data) =>
      IO.loadTextFile('http://localhost:1337/http%3A%2F%2Ftheverge.com', (data) =>
        data = JSON.parse(data)
        console.log(data.log.entries.map((e) -> e.request.url))
        @entries = data.log.entries

        console.log('data.log.entries.length', data.log.entries.length)

        @mimeTypes = unique(@entries.map(getEntryMimeType))
        @servers = unique(@entries.map(getEntryUrl).map(urlToHostName))
        @rootServers = unique(@servers.map(extractTopLevelDomain))

        console.log('@entries.length', @entries.length)
        console.log('@mimeTypes.length', @mimeTypes.length)
        console.log('@rootServers.length', @rootServers.length)
        console.log( @mimeTypes, @rootServers)

        @buildInstances()

        #if Platform.isPlask then @recorder.start();

        boom = () =>
          @camera.position.z = 5
          #timeline.anim(@camera.position).to(0, {z:15}, 4, timeline.Timeline.Easing.Cubic.EaseInOut)

        #setInterval(boom, 4100)

        boom()
      )

    buildInstances: () ->
      pageStartTime = 0
      pageEndTime = 0
      for entry in @entries
        entryStartDate = new Date(entry.startedDateTime)
        entryStartTime = entryStartDate.getTime()
        entryTime = Number(entry.time)
        entry._info = {}
        entry._info.startTime = entryStartTime
        entry._info.time = entryTime
        entry._info.endTime = entryStartTime + entryTime
        if !pageStartTime then pageStartTime = entryStartTime
        pageEndTime = entryStartTime + entryTime

      for entry in @entries
        entry._info.pageStartTime = pageStartTime
        entry._info.pageEndTime = pageEndTime

      @entries.map(@makeEntryInstance.bind(this))
      console.log('buildInstances', 'done', @entries.length, (pageEndTime - pageStartTime)/1000 + 's')

    saveScreenshot: (path) ->
      d = new Date();
      filename = path + "/screenshot_"
      filename += "#{d.getFullYear()}-#{pad(d.getMonth()+1,'0',2)}-#{pad(d.getDate(),'0',2)}"
      filename += "_#{pad(d.getHours(),'0',2)}:#{pad(d.getMinutes(),'0',2)}:#{pad(d.getSeconds(),'0',2)}.png"
      @gl.writeImage('png', filename)

    makeEntryInstance: (entry, entryIndex) ->
      rootServer = urlToHostName(getEntryUrl(entry))
      mimeType = getEntryMimeType(entry)

      r = entryIndex/32
      hue = @mimeTypes.indexOf(mimeType) / @mimeTypes.length
      #hue = 0.2;
      color = Color.createHSV(hue, 0.8, 0.7 + r)
      b = 2;
      white = Color.create(b, b, b, 1.0)

      geom = new Cube(0.1, 0.1, 2.5, 2, 2, 7)
      entryInstance = new Mesh(geom, new CorrectedGamma({diffuseColor: white, specularColor: new Color(0.1, 0.1, 0.1, 1.0), ambientColor: new Color(0.1, 0.1, 0.1, 1), wrap: 1, correctGamma: true, conserveDiffuseEnergy: true }))
      entryInstance = new Mesh(geom, new SolidColor({color: white, specularColor: new Color(0.1, 0.1, 0.1, 1.0), ambientColor: new Color(0.1, 0.1, 0.1, 1), wrap: 1, correctGamma: true, conserveDiffuseEnergy: true }))
      #entryInstance.position = randomVec3(10)
      info = entry._info
      entryInstance.position.x = map(info.startTime, info.pageStartTime, info.pageEndTime, -4, 4)
      entryInstance.position.y = randomFloat(-1, 1)
      entryInstance.position.z = 0
      @instances.push(entryInstance)
      #@scene.add(entryInstance)

      geom = new Cube(0.1, 0.1, 2.5, 2, 2, 7)
      entryInstance2 = new Mesh(geom, new CorrectedGamma({diffuseColor: color, specularColor: new Color(0.1, 0.1, 0.1, 1.0), ambientColor: new Color(0.1, 0.1, 0.1, 1), wrap: 1, correctGamma: true, conserveDiffuseEnergy: true }))
      entryInstance2.position = entryInstance.position.dup()
      #entryInstance2.position.z += 0.01 + 1.5
      @instances.push(entryInstance2)
      @scene.add(entryInstance2)

    drawScene: () ->
      @gl.clearColor(@bgColor.r, @bgColor.g, @bgColor.b, @bgColor.a)
      @gl.clear(@gl.COLOR_BUFFER_BIT | @gl.DEPTH_BUFFER_BIT)
      @gl.enable(@gl.DEPTH_TEST)
      @scene.draw(@camera)

      if @needsScreenshot
        @saveScreenshot('screenshots')
        @needsScreenshot = false

    drawDepth: () ->
      @gl.clearColor(@bgColor.r, @bgColor.g, @bgColor.b, @bgColor.a)
      @gl.clear(@gl.COLOR_BUFFER_BIT | @gl.DEPTH_BUFFER_BIT)
      @gl.enable(@gl.DEPTH_TEST)

      if !@showDepthMaterial
        @showDepthMaterial = new ShowDepth({
          far: 9
        })

      oldMaterials = @instances.map((instance) =>
        oldMaterial = instance.material
        instance.setMaterial(@showDepthMaterial)
        oldMaterial
      )

      @scene.draw(@camera)

      oldMaterials.forEach((material, index) =>
        @instances[index].setMaterial(material)
      )

      if @needsScreenshot
        @saveScreenshot('screenshots')
        @needsScreenshot = false

    draw: () ->
      if Platform.isPlask then @recorder.update();
      timeline.Timeline.getGlobalInstance().update(Time.delta)
      @camera.updateMatrices();

      @gl.clearColor(1, 0, 0, 1)
      @gl.clear(@gl.COLOR_BUFFER_BIT)
      @gl.disable(@gl.DEPTH_TEST)

      color = fx().render({drawFunc: this.drawScene.bind(this), bpp2: 32, depth: true, width: @width, height: @height})
      depth = color.render({drawFunc: this.drawDepth.bind(this), bpp2: 32, depth: true, width: @width, height: @height})
      foggy = color.fog(depth, { fogColor: @bgColor, bpp2: 32 })
      #foggy = foggy.fxaa();
      foggy.blit({ width: @width, height: @height })
      if Platform.isPlask then @recorder.capture()

      #@draw = () -> console
  )