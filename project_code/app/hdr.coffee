pex = pex || require('./lib/pex')

{ IO, Window, Platform } = pex.sys
{ PerspectiveCamera, Scene, Arcball } = pex.scene
{ SolidColor, Diffuse, ShowDepth, Textured } = pex.materials
{ Mesh, Texture2D } = pex.gl
{ Cube, Sphere, Icosahedron } = pex.geom.gen
{ Vec3, hem, Quat } = pex.geom
{ Color } = pex.color
{ MathUtils } = pex.utils
{ randomVec3, seed } = MathUtils
{ GUI } = pex.gui
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


pex.require(['materials/CorrectedGamma', 'materials/SkyBox', 'materials/Reflection', 'fx/Fog', 'fx/TonemapLinear', 'fx/TonemapReinhard', 'fx/TonemapUncharted',
  'fx/TonemapRichard', 'fx/CorrectGamma', 'fx/Save', 'utils/Settings'], (CorrectedGamma, SkyBox, Reflection, Fog, TonemapLinear, TonemapReinhard, TonemapUncharted, TonemapRichard, CorrectGamma, Save, settings) ->
  Window.create
    settings:
      width: 1000
      height: 500
    init: () ->
      seed(12)

      @gui = new GUI(this)
      settings().init(@gui)

      @initScene()

      @needsScreenshot = false
      @on('keyDown', (e) =>
        if e.str == 'S'
          @needsScreenshot = true
      )

    initScene: () ->
      @instances = []
      @camera = new PerspectiveCamera(60, @width / @height)
      @camera.setPosition(new Vec3(0, 0, -5))
      @scene = new Scene()
      @arcball = new Arcball(this, @camera)

      @bgColor = Color.create(0.15*0.09, 0.18*0.09, 0.226*0.09, 1)

      sphere = new Mesh(new Sphere(10, 10, 10), new SkyBox({texture : Texture2D.load('assets/lookout.png')}))
      @scene.add(sphere)

      material = new Reflection({diffuseTexture : Texture2D.load('assets/lookout_diffuse.png'), reflectionTexture : Texture2D.load('assets/lookout.png')})
      geom = new Icosahedron(1)
      geom = hem().fromGeometry(geom)
        #.selectRandomFaces(0.5).extrude(0.25)
        #.selectRandomFaces(0.5).extrude(0.25)
        #.subdivide()
        #.subdivide()
        .selectRandomFaces(0.15)
        .extrude(0.25)
        #.smoothDooSabin(0.1)
        #.extrude(0.05)
        .subdivide()
        .selectRandomFaces(0.15)
        .extrude(0.25)
        .subdivide()
        #.triangulate()
        #.selectRandomFaces(0.95).extrude(0.01)
        .toFlatGeometry()
        #.toSmoothGeometry()

      for i in [0...1]
        cube = new Mesh(geom, material)
        cube.position = new Vec3()
        cube.position.z = 1 - i / 50 - 0.5
        cube.position.x = 3 * Math.cos(2 * Math.PI * i/50)
        cube.position.y = 3 * Math.sin(2 * Math.PI * i/50)
        cube.position = randomVec3(1)
        #cube.scale = randomVec3(3)
        cube.rotation = Quat.create().setAxisAngle(randomVec3().normalize(), 2 * Math.PI * i / 50 / Math.PI * 360)
        @instances.push(cube)
        @scene.add(cube)

    saveScreenshot: (path) ->
      d = new Date();
      filename = path + "/screenshot_"
      filename += "#{d.getFullYear()}-#{pad(d.getMonth()+1,'0',2)}-#{pad(d.getDate(),'0',2)}"
      filename += "_#{pad(d.getHours(),'0',2)}:#{pad(d.getMinutes(),'0',2)}:#{pad(d.getSeconds(),'0',2)}.png"
      @gl.writeImage('png', filename)

    drawScene: () ->
      @gl.clearColor(@bgColor.r, @bgColor.g, @bgColor.b, @bgColor.a)
      @gl.clear(@gl.COLOR_BUFFER_BIT | @gl.DEPTH_BUFFER_BIT)
      @gl.enable(@gl.DEPTH_TEST)
      @scene.draw(@camera)

      for instance in @instances
        instance.material.uniforms.eyePos = @camera.getPosition()
        instance.material.uniforms.reflection = settings().getFloat('reflection', 0.5, 0, 1)

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

    draw: () ->
      @gl.clearColor(0, 0, 0, 1)
      @gl.clear(@gl.COLOR_BUFFER_BIT)
      @gl.disable(@gl.DEPTH_TEST)

      color = fx().render({drawFunc: this.drawScene.bind(this), bpp: 32, depth: true, width: @width*2, height: @height*2})
      depth = color.render({drawFunc: this.drawDepth.bind(this), bpp: 32, depth: true, width: @width, height: @height})
      #tonemapped = foggy.tonemapReinhard();
      #tonemapped = foggy.tonemapUncharted();
      #tonemapped = foggy.tonemapRichard();
      #tonemapped.blit({ width: @width, height: @height })
      #foggy.blit({ width: @width, height: @height })
      color = color.fxaa({bpp:32})
      #color = color.fog(depth, { fogColor: @bgColor, bpp: 32 })
      if settings().getBool('richard', false)
        color = color.tonemapRichard({exposure: settings().getFloat('exposure', 3, 0.5, 20.0), bpp: 32})
      else
        color = color
          .tonemapReinhard({exposure: settings().getFloat('exposure', 3, 0, 10.0), bpp: 32})
          .correctGamma({bpp: 32})

      if @needsScreenshot
        color.save('screenshots', {bpp: 32})
        @needsScreenshot = false

      color.blit({ width: @width, height: @height })
      #color.blit({ width: @width, height: @height })

      #color.tonemapRichard().blit({ width: @width, height: @height })
      #color.blit({ width: @width, height: @height })

      @gui.draw()
  )