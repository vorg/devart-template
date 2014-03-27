define (require) ->

  pex = require('pex')

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

  CorrectedGamma = require('materials/CorrectedGamma')
  Fog = require('fx/Fog')
  TonemapLinear = require('fx/TonemapLinear')
  TonemapReinhard = require('fx/TonemapReinhard')
  TonemapUncharted = require('fx/TonemapUncharted')
  TonemapRichard = require('fx/TonemapRichard')
  timeline = require('lib/timeline')

  unique = (array) ->
    array.sort().filter((e, i, arr) -> arr.lastIndexOf(e) == i)

  getEntryMimeType = (entry) ->
    entry.response.content.mimeType

  getEntryUrl = (entry) ->
    entry.request.url

  urlToHostName = (() ->
    if Platform.isPlask
      url = global['require']('url')
      (s) -> url.parse(s).hostname
    else if Platform.isBrowser
      a = document.createElement("a")
      (s) ->
        a.href = s;
        a.hostname || s
    else (s) -> s
  )()

  extractTopLevelDomain = (domain) ->
    try
      domain.match(/[^\.]+\.[^\.]+$/)[0]
    catch e
      if domain.indexOf('data') == 0 then return 'data'
      else return 'undefined'

  # adds leading zeros to a number until certain length is met
  pad = (num, char, len) ->
    s = '' + num
    while s.length < len
      s = char + s
    s


  class Burst
    constructor: (@win) ->
      @width = @win.width
      @height = @win.height
      @gl = @win.gl
      @init()

    init: () ->
      seed(0)

      if Platform.isPlask then @recorder = new MovieRecorder('screenshots')
      if Platform.isBrowser then @gl.getExtension("OES_texture_float")

      @initScene()
      #@loadData()

      #@needsScreenshot = false
      #@on('keyDown', (e) =>
      #  if e.str == 'S'
      #    @needsScreenshot = true
      #)


    initScene: () ->
      @instances = []
      @instances2 = []
      @camera = new PerspectiveCamera(60, @width / @height)
      @camera.setPosition(new Vec3(0, 0, 6));
      @scene = new Scene()
      #@arcball = new Arcball(this, @camera)
      @camera.target = new Vec3(0, 0, -20)

      @bgColor = Color.create(0.15*0.9, 0.18*0.9, 0.226*0.9, 1)

    loadData: (url, callback) ->
      @instances = []
      @instances2 = []
      
      IO.loadTextFile(url, (data) =>
        console.log(data)
        data = JSON.parse(data)
        #console.log(data.log.entries.map((e) -> e.request.url))
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

        callback();

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

      white = Color.create(1, 1, 1, 1.0)
      @instanceMaterial = new SolidColor({color: white, specularColor: new Color(0.1, 0.1, 0.1, 1.0), ambientColor: new Color(0.1, 0.1, 0.1, 1), wrap: 1, correctGamma: true, conserveDiffuseEnergy: true })
      @instanceGammaMaterial = new CorrectedGamma({diffuseColor: white, specularColor: new Color(0.1, 0.1, 0.1, 1.0), ambientColor: new Color(0.1, 0.1, 0.1, 1), wrap: 1, correctGamma: true, conserveDiffuseEnergy: true })

      geom = new Cube(0.1, 0.1, 2.5)
      geom.computeEdges()
      @instanceMesh = new Mesh(geom, @instanceGammaMaterial)
      @instanceMesh2 = new Mesh(geom, @instanceGammaMaterial, { useEdges: true })

      @entries.map(@makeEntryInstance.bind(this))
      console.log('buildInstances', 'done', @entries.length, (pageEndTime - pageStartTime)/1000 + 's')

    saveScreenshot: (path) ->
      d = new Date();
      filename = path + "/screenshot_"
      filename += "#{d.getFullYear()}-#{pad(d.getMonth()+1,'0',2)}-#{pad(d.getDate(),'0',2)}"
      filename += "_#{pad(d.getHours(),'0',2)}:#{pad(d.getMinutes(),'0',2)}:#{pad(d.getSeconds(),'0',2)}.png"
      @gl.writeImage('png', filename)

    mimeTypeToColor: (mimeType) ->
      #r = entryIndex/32
      #hue = @mimeTypes.indexOf(mimeType) / @mimeTypes.length
      hue = 0
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

      if hue == 0
        Color.createHSV(0, 0, 0.7)
      else
        Color.createHSV(hue, 0.8, 1.7)


    makeEntryInstance: (entry, entryIndex) ->
      rootServer = urlToHostName(getEntryUrl(entry))
      mimeType = getEntryMimeType(entry)

      setCookies = entry.response.headers.filter (header) ->
        header.name == 'Set-Cookie'
      if entry.request.cookies.length > 0 || setCookies.length > 0
        console.log(entryIndex, entry.request.url, entry.request.cookies.length, setCookies.length, setCookies)

      info = entry._info

      color = @mimeTypeToColor(mimeType)

      #geom = new Cube(0.1, 0.1, 2.5, 2, 2, 7)
      #entryInstance = new Mesh(geom, new CorrectedGamma({diffuseColor: white, specularColor: new Color(0.1, 0.1, 0.1, 1.0), ambientColor: new Color(0.1, 0.1, 0.1, 1), wrap: 1, correctGamma: true, conserveDiffuseEnergy: true }))
      entryInstance = {}
      entryInstance.position = randomVec3(10)

      entryInstance.position.x = map(info.startTime, info.pageStartTime, info.pageEndTime, -4.5, 4.5)
      entryInstance.position.y = randomFloat(-2, 2)
      entryInstance.position.z = -30
      entryInstance.scale = new Vec3(1, 1, 1)
      entryInstance.scale.x = 1 + info.time / 5000;
      entryInstance.scale.y = 1.4
      entryInstance.scale.z = 1.05
      if setCookies.length > 0
        entryInstance.uniforms = {
          diffuseColor: new Color(2, 0, 0, 1)
        }
        @instances2.push(entryInstance)
      #@scene.add(entryInstance)

      entryInstance2 = {}
      entryInstance2.position = entryInstance.position.dup()
      entryInstance2.uniforms = {
        diffuseColor: color
      }
      entryInstance2.scale = new Vec3(1, 1, 1)
      entryInstance2.scale.x = 1 + info.time / 5000;

      entryInstance2.position.z = -30

      delay = map(info.startTime, info.pageStartTime, info.pageEndTime, 1, 5)
      timeline.anim(entryInstance2.position).to(delay, {z:0}, 1, timeline.Timeline.Easing.Cubic.EaseInOut)
      timeline.anim(entryInstance.position).to(delay, {z:0}, 1, timeline.Timeline.Easing.Cubic.EaseInOut)
      @instances.push(entryInstance2)

      #@scene.add(entryInstance2)

    drawScene: () ->
      @gl.clearColor(@bgColor.r, @bgColor.g, @bgColor.b, @bgColor.a)
      @gl.clear(@gl.COLOR_BUFFER_BIT | @gl.DEPTH_BUFFER_BIT)
      @gl.enable(@gl.DEPTH_TEST)
      @gl.lineWidth(2)
      #@scene.draw(@camera)

      if @instanceMesh then @instanceMesh.drawInstances(@camera, @instances)
      if @instanceMesh2 then @instanceMesh2.drawInstances(@camera, @instances2)

      #if @needsScreenshot
      #  @saveScreenshot('screenshots')
      #  @needsScreenshot = false

    drawDepth: () ->
      @gl.clearColor(@bgColor.r, @bgColor.g, @bgColor.b, @bgColor.a)
      @gl.clear(@gl.COLOR_BUFFER_BIT | @gl.DEPTH_BUFFER_BIT)
      @gl.enable(@gl.DEPTH_TEST)

      if !@showDepthMaterial
        @showDepthMaterial = new ShowDepth({
          far: 30
        })

      if !@instanceMesh then return

      oldMaterial = @instanceMesh.material
      @instanceMesh.setMaterial(@showDepthMaterial)
      @instanceMesh2.setMaterial(@showDepthMaterial)

      if @instanceMesh then @instanceMesh.drawInstances(@camera, @instances)
      if @instanceMesh2 then @instanceMesh2.drawInstances(@camera, @instances2)

      @instanceMesh.setMaterial(@instanceGammaMaterial)
      @instanceMesh2.setMaterial(@instanceGammaMaterial)

      if @needsScreenshot
        @saveScreenshot('screenshots')
        @needsScreenshot = false

    draw: () ->
      #if Platform.isPlask then @recorder.update();
      timeline.Timeline.getGlobalInstance().update(Time.delta)
      #@camera.updateMatrices();

      @gl.clearColor(1, 0, 0, 1)
      @gl.clear(@gl.COLOR_BUFFER_BIT)
      @gl.disable(@gl.DEPTH_TEST)

      color = fx().render({drawFunc: this.drawScene.bind(this), bpp2: 32, depth: true, width: @width, height: @height})
      depth = color.render({drawFunc: this.drawDepth.bind(this), bpp2: 32, depth: true, width: @width, height: @height})
      foggy = color.fog(depth, { fogColor: @bgColor, bpp2: 32 })
      foggy = foggy.fxaa()
      foggy.blit({ width: @width, height: @height })
      #@drawScene()
      #if Platform.isPlask then @recorder.capture()

